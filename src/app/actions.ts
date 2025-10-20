"use server";

import { analyzeDPRImage, type AnalyzeDPRImageInput } from "@/ai/flows/analyze-dpr-image";
import { z } from "zod";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const ActionInputSchema = z.object({
  reportId: z.string(),
  evaluationCriteria: z.string().min(10, "Evaluation criteria must be at least 10 characters long."),
});

export async function performAnalysis(input: z.infer<typeof ActionInputSchema>) {
  const validatedInput = ActionInputSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new Error(validatedInput.error.errors.map(e => e.message).join(', '));
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('NVIDIA API key missing. Set NVIDIA_API_KEY in your environment.');
    throw new Error(
      "Missing NVIDIA API key. Define NVIDIA_API_KEY in a .env.local file, then restart the dev server.",
    );
  }

  const { reportId, evaluationCriteria } = validatedInput.data;

  const selectedReport = PlaceHolderImages.find(report => report.id === reportId);
  if (!selectedReport) {
    throw new Error("Selected DPR reference was not found.");
  }

  const analysisInput: AnalyzeDPRImageInput = {
    reportText: selectedReport.reportText,
    evaluationCriteria,
  };

  try {
    const result = await analyzeDPRImage(analysisInput);
    return result;
  } catch (error) {
    console.error("AI analysis failed:", error);

    const message = error instanceof Error ? error.message : String(error);
    if (/Invalid API key|Unauthorized/i.test(message)) {
      throw new Error(
        "NVIDIA rejected the API key. Make sure NVIDIA_API_KEY matches the exact key from the NVIDIA AI Foundation Models console and that the requested model is enabled for your organization.",
      );
    }

    if (/quota|permission|access denied/i.test(message)) {
      throw new Error(
        "The NVIDIA API reported a permission or quota issue. Confirm your org has access to the selected model and sufficient credit limits in the NVIDIA API console.",
      );
    }

    throw new Error("The AI analysis failed to produce a result. Please try again.");
  }
}
