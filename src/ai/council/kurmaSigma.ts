import { DEFAULT_NVIDIA_MODEL, nvidiaClient } from "@/ai/genkit";
import {
  AnalyzeDPRImageInput,
  AnalyzeDPRImageOutput,
  AnalyzeDPRImageOutputSchema,
} from "@/ai/flows/schemas";
import { z } from "zod";
import type { CouncilUpdate } from "@/lib/types";

const StrategistSchema = z.object({ hypothesis: z.string() });
const SkepticSchema = z.object({ critique: z.string() });
const ResearcherSchema = z.object({
  thought: z.string(),
  tool: z.enum(["web_search", "ask_user", "none"]).default("none"),
  query: z.string().optional(),
});
const ConductorSchema = z.object({ decision: z.string(), rationale: z.string().optional() });
const JudgeSchema = z.object({
  verdict: z.string(),
  reasoning: z.string(),
  nextQuestion: z.string().nullable().optional(),
});
const SynthesisSchema = z.object({
  councilVerdict: z.string(),
  riskBand: z.enum(["RED", "AMBER", "GREEN"]),
  confidenceScore: z.number().min(0).max(100),
  governanceAction: z.string(),
});

type GenerateJsonParams<T> = {
  schema: z.ZodType<T>;
  prompt: string;
};

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fencedJson = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJson) {
    return fencedJson[1].trim();
  }

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\s*/u, "").replace(/```$/u, "").trim();
  }

  return trimmed;
}

async function generateJson<T>({ schema, prompt }: GenerateJsonParams<T>): Promise<T> {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY must be configured to run DPR analysis.");
  }

  const completion = await nvidiaClient.chat.completions.create({
    model: DEFAULT_NVIDIA_MODEL,
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content:
          "You are a structured reasoning agent. Reply with a single JSON object only, matching the requested schema exactly. Do not include markdown fences or commentary.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const message = completion.choices[0]?.message?.content;
  if (!message) {
    throw new Error("Model response did not include content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonPayload(message));
  } catch (error) {
    throw new Error(
      `Failed to parse model output as JSON: ${
        error instanceof Error ? error.message : String(error)
      }\nRaw output: ${message}`,
    );
  }

  return schema.parse(parsed);
}

async function tavilySearch(query: string, n: number = 3): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return "Error: TAVILY_API_KEY not configured.";
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: n,
        search_depth: "advanced",
      }),
    });

    if (!response.ok) {
      return `Tavily API error: ${response.status} ${response.statusText}`;
    }

    const data = (await response.json()) as {
      results?: Array<{ title?: string; content?: string }>;
    };

    const results = data.results ?? [];
    if (results.length === 0) {
      return "Tavily returned no results.";
    }

    return results
      .map((r, index) => {
        const title = r.title ?? `Result ${index + 1}`;
        const snippet = r.content ?? "";
        return `${title}: ${snippet}`.trim();
      })
      .join("\n");
  } catch (error) {
    return `Tavily request failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

type CouncilRuntimeState = {
  evaluationCriteria: string;
  reportText: string;
  hypothesis: string;
  critique: string;
  researchThought: string;
  researchTool: "web_search" | "ask_user" | "none";
  researchQuery?: string;
  observation: string;
  conductorDecision: string;
  judgeVerdict: string;
  judgeReasoning: string;
  judgeNextQuestion?: string | null;
  oraclesUsed: string[];
};

function buildDeliberationTrace(state: CouncilRuntimeState): string {
  const excerpt = state.reportText.length > 1200
    ? `${state.reportText.slice(0, 1200)}…`
    : state.reportText;

  const sections = [
    "Kurma-Σ Council Deliberation",
    `Source DPR Text (excerpt): ${excerpt}`,
    `Evaluation Criteria Provided: ${state.evaluationCriteria}`,
    `Strategist Hypothesis:\n${state.hypothesis}`,
    `Skeptic Critique:\n${state.critique}`,
    `Researcher Thought (${state.researchTool}${
      state.researchQuery ? ` → ${state.researchQuery}` : ""
    }):\n${state.researchThought}`,
    `Observation:\n${state.observation}`,
    `Conductor Decision:\n${state.conductorDecision}`,
    `Judge Verdict: ${state.judgeVerdict}\nReasoning: ${state.judgeReasoning}`,
  ];

  if (state.judgeNextQuestion) {
    sections.push(`Follow-up Question Suggested by Judge:\n${state.judgeNextQuestion}`);
  }

  if (state.oraclesUsed.length > 0) {
    sections.push(`External Tools Invoked: ${state.oraclesUsed.join(", ")}`);
  }

  return sections.join("\n\n▸ ▸ ▸\n\n");
}

async function runStrategist(
  input: AnalyzeDPRImageInput,
): Promise<{ hypothesis: string }> {
  return generateJson({
    schema: StrategistSchema,
    prompt: `You are the STRATEGIST within the Kurma-Σ council.

User evaluation criteria: "${input.evaluationCriteria}".

Detailed Project Report (verbatim text):
"""
${input.reportText}
"""

Formulate a single, falsifiable hypothesis that captures the most critical insight emerging from this DPR text in the context of the evaluation criteria.
Respond in JSON with a single key "hypothesis".`,
  });
}

async function runSkeptic(
  input: AnalyzeDPRImageInput,
  hypothesis: string,
): Promise<{ critique: string }> {
  return generateJson({
    schema: SkepticSchema,
    prompt: `You are the SKEPTIC on the Kurma-Σ council. The Strategist proposed the following hypothesis:
"${hypothesis}".

User evaluation criteria: "${input.evaluationCriteria}".

Detailed Project Report (verbatim text):
"""
${input.reportText}
"""

Identify the single weakest point or risk in that hypothesis, grounding your critique in evidence from the DPR text. Respond in JSON with "critique".`,
  });
}

async function runResearcher(
  input: AnalyzeDPRImageInput,
  hypothesis: string,
  critique: string,
): Promise<{ thought: string; tool: "web_search" | "ask_user" | "none"; query?: string }> {
  const result = await generateJson({
    schema: ResearcherSchema,
    prompt: `You are the RESEARCHER for the Kurma-Σ council. Your job is to resolve the contention between the hypothesis and critique.
Hypothesis: ${hypothesis}
Critique: ${critique}
Evaluation criteria: "${input.evaluationCriteria}".
Detailed Project Report (verbatim text):
"""
${input.reportText}
"""
If objective external data is required, choose the "web_search" tool and provide a precise query.
If clarification from the user is absolutely necessary, choose "ask_user" and provide the question.
If no additional tool is needed, set "tool" to "none".
Respond in JSON with keys: "thought" (your reasoning), "tool", and optional "query".`,
  });
  return {
    thought: result.thought,
    tool: result.tool ?? "none",
    query: result.query,
  };
}

async function runConductor(params: {
  hypothesis: string;
  critique: string;
  researchThought: string;
  researchTool: string;
  observation: string;
}): Promise<{ decision: string; rationale?: string }> {
  return generateJson({
    schema: ConductorSchema,
    prompt: `You are the CONDUCTOR coordinating the Kurma-Σ council.
Hypothesis: ${params.hypothesis}
Critique: ${params.critique}
Research insight: ${params.researchThought}
Observation gathered: ${params.observation || "None"}
Research tool used: ${params.researchTool}.
Choose the next action from this list: "FINALIZE", "DEEPEN_ANALYSIS", or "FLAG_RISK". Provide the decision and a short rationale in JSON with keys "decision" and "rationale".`,
  });
}

async function runJudge(params: {
  evaluationCriteria: string;
  hypothesis: string;
  observation: string;
  critique: string;
  reportText: string;
}): Promise<{ verdict: string; reasoning: string; nextQuestion?: string | null }> {
  const result = await generateJson({
    schema: JudgeSchema,
    prompt: `You are the JUDGE for the Kurma-Σ council. Determine whether the hypothesis is supported given the evidence collected.
Evaluation criteria: "${params.evaluationCriteria}".
Hypothesis: ${params.hypothesis}
Critique: ${params.critique}
Observation: ${params.observation || "None"}
Detailed Project Report (verbatim text):
"""
${params.reportText}
"""
Respond in JSON with keys:
- "verdict": one of [SUPPORTED, REFUTED, INCONCLUSIVE]
- "reasoning": one concise sentence referencing the evaluation criteria
- "nextQuestion": optional follow-up question (or null).`
  });
  return {
    verdict: result.verdict,
    reasoning: result.reasoning,
    nextQuestion: result.nextQuestion ?? null,
  };
}

async function runFinalSynthesis(params: {
  evaluationCriteria: string;
  hypothesis: string;
  critique: string;
  observation: string;
  judgeVerdict: string;
  judgeReasoning: string;
  conductorDecision: string;
  reportText: string;
}): Promise<z.infer<typeof SynthesisSchema>> {
  return generateJson({
    schema: SynthesisSchema,
    prompt: `You are the lead synthesizer for the Kurma-Σ council. Using the data below, produce a final recommendation for the DPR review.
Evaluation criteria: "${params.evaluationCriteria}".
Hypothesis: ${params.hypothesis}
Critique: ${params.critique}
Observation: ${params.observation || "None"}
Judge verdict: ${params.judgeVerdict} (reason: ${params.judgeReasoning})
Conductor decision: ${params.conductorDecision}
Detailed Project Report (verbatim text):
"""
${params.reportText}
"""
Return JSON with keys:
- "councilVerdict": decisive, user-tailored statement
- "riskBand": one of RED, AMBER, GREEN reflecting risk level
- "confidenceScore": integer 0-100 expressing confidence
- "governanceAction": concrete next step aligned with evaluation criteria.`,
  });
}

async function resolveObservation(
  researcher: Awaited<ReturnType<typeof runResearcher>>,
  evaluationCriteria: string,
): Promise<{ observation: string; oraclesUsed: string[] }> {
  if (researcher.tool === "web_search" && researcher.query) {
    const data = await tavilySearch(researcher.query);
    return {
      observation: data,
      oraclesUsed: ["web_search"],
    };
  }

  if (researcher.tool === "ask_user" && researcher.query) {
    return {
      observation: `User context (auto-response): ${evaluationCriteria}. Question that would be asked: ${researcher.query}`,
      oraclesUsed: ["ask_user"],
    };
  }

  return {
    observation: researcher.thought,
    oraclesUsed: researcher.tool === "none" ? [] : [researcher.tool],
  };
}

type UpdateCallback = (update: CouncilUpdate, elapsedMs: number) => void;

const laneByStep: Record<CouncilUpdate["step"], CouncilUpdate["lane"]> = {
  strategist: 0,
  skeptic: 2,
  researcher: 1,
  observation: 1,
  conductor: 1,
  judge: 2,
  synthesis: 1,
};

export async function runKurmaSigmaDeliberation(
  input: AnalyzeDPRImageInput,
  onUpdate?: UpdateCallback,
): Promise<AnalyzeDPRImageOutput> {
  const start = Date.now();
  const emit = (update: CouncilUpdate) => {
    if (onUpdate) {
      onUpdate(update, Date.now() - start);
    }
  };

  const { hypothesis } = await runStrategist(input);
  emit({
    step: "strategist",
    title: "Strategist Hypothesis",
    summary: hypothesis,
    detail: `Evaluation focus: ${input.evaluationCriteria}`,
    lane: laneByStep.strategist,
  });

  const { critique } = await runSkeptic(input, hypothesis);
  emit({
    step: "skeptic",
    title: "Skeptic Risk Callout",
    summary: critique,
    detail: "Primary vulnerability identified by the skeptic agent.",
    lane: laneByStep.skeptic,
  });

  const researcher = await runResearcher(input, hypothesis, critique);
  emit({
    step: "researcher",
    title: "Researcher Resolution Plan",
    summary: researcher.thought,
    detail:
      researcher.tool === "none"
        ? "No external tools required."
        : `Tool: ${researcher.tool}${researcher.query ? ` → ${researcher.query}` : ""}`,
    lane: laneByStep.researcher,
  });

  const { observation, oraclesUsed } = await resolveObservation(
    researcher,
    input.evaluationCriteria,
  );
  emit({
    step: "observation",
    title: "Evidence Collected",
    summary: observation.slice(0, 360),
    detail: oraclesUsed.length > 0 ? `External tools: ${oraclesUsed.join(", ")}` : undefined,
    lane: laneByStep.observation,
  });

  const conductor = await runConductor({
    hypothesis,
    critique,
    researchThought: researcher.thought,
    researchTool: researcher.tool,
    observation,
  });
  emit({
    step: "conductor",
    title: "Conductor Directive",
    summary: conductor.decision,
    detail: conductor.rationale,
    lane: laneByStep.conductor,
  });

  const judge = await runJudge({
    evaluationCriteria: input.evaluationCriteria,
    hypothesis,
    critique,
    observation,
    reportText: input.reportText,
  });
  emit({
    step: "judge",
    title: "Judge Verdict",
    summary: judge.verdict,
    detail: judge.nextQuestion
      ? `${judge.reasoning}
Follow-up: ${judge.nextQuestion}`
      : judge.reasoning,
    lane: laneByStep.judge,
  });

  const synthesis = await runFinalSynthesis({
    evaluationCriteria: input.evaluationCriteria,
    hypothesis,
    critique,
    observation,
    judgeVerdict: judge.verdict,
    judgeReasoning: judge.reasoning,
    conductorDecision: conductor.decision,
    reportText: input.reportText,
  });
  emit({
    step: "synthesis",
    title: "Synthesis Preview",
    summary: synthesis.councilVerdict,
    detail: `Risk band: ${synthesis.riskBand} • Confidence: ${synthesis.confidenceScore}%`,
    lane: laneByStep.synthesis,
  });

  const state: CouncilRuntimeState = {
    evaluationCriteria: input.evaluationCriteria,
    reportText: input.reportText,
    hypothesis,
    critique,
    researchThought: researcher.thought,
    researchTool: researcher.tool,
    researchQuery: researcher.query,
    observation,
    conductorDecision: conductor.decision,
    judgeVerdict: judge.verdict,
    judgeReasoning: judge.reasoning,
    judgeNextQuestion: judge.nextQuestion,
    oraclesUsed,
  };

  const deliberationTrace = buildDeliberationTrace(state);

  const output: AnalyzeDPRImageOutput = {
    deliberationTrace,
    councilVerdict: synthesis.councilVerdict,
    riskBand: synthesis.riskBand,
    confidenceScore: synthesis.confidenceScore,
    governanceAction: synthesis.governanceAction,
  };

  const validation = AnalyzeDPRImageOutputSchema.safeParse(output);
  if (!validation.success) {
    throw new Error(`Generated output failed schema validation: ${validation.error.message}`);
  }

  return validation.data;
}
