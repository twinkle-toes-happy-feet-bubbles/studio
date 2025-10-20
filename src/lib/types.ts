import type { AnalyzeDPRImageOutput } from "@/ai/flows/analyze-dpr-image";

export type AnalysisResult = AnalyzeDPRImageOutput;

export type CouncilStep =
	| "strategist"
	| "skeptic"
	| "researcher"
	| "observation"
	| "conductor"
	| "judge"
	| "synthesis";

export const COUNCIL_STEPS: CouncilStep[] = [
	"strategist",
	"skeptic",
	"researcher",
	"observation",
	"conductor",
	"judge",
	"synthesis",
];

export const COUNCIL_STEP_TOTAL = COUNCIL_STEPS.length;

export type CouncilUpdate = {
	step: CouncilStep;
	title: string;
	summary: string;
	detail?: string;
	lane: 0 | 1 | 2;
};

export type AnalysisStreamEvent =
	| { kind: "update"; data: CouncilUpdate; elapsedMs: number }
	| { kind: "final"; data: AnalysisResult; elapsedMs: number }
	| { kind: "error"; message: string; elapsedMs: number };
