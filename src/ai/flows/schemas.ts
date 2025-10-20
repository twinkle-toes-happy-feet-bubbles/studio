import { z } from "zod";

/**
 * The input for the DPR image analysis flow.
 */
export const AnalyzeDPRImageInputSchema = z.object({
  reportText: z
    .string()
    .describe(
      "The textual content of the Detailed Project Report that should be analyzed.",
    ),
  evaluationCriteria: z
    .string()
    .describe("The user-provided criteria for evaluating the DPR image."),
});
export type AnalyzeDPRImageInput = z.infer<typeof AnalyzeDPRImageInputSchema>;

/**
 * The output for the DPR image analysis flow.
 */
export const AnalyzeDPRImageOutputSchema = z.object({
  deliberationTrace: z
    .string()
    .describe(
      "A detailed trace of the AI deliberation process, including all council member contributions.",
    ),
  councilVerdict: z
    .string()
    .describe("The final verdict or recommendation from the AI council."),
  riskBand: z
    .enum(["RED", "AMBER", "GREEN"])
    .describe("The assessed risk level, categorized as RED, AMBER, or GREEN."),
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("A numerical score indicating the AI's confidence in its analysis and verdict."),
  governanceAction: z
    .string()
    .describe("Recommended governance action based on the analysis."),
});
export type AnalyzeDPRImageOutput = z.infer<typeof AnalyzeDPRImageOutputSchema>;
