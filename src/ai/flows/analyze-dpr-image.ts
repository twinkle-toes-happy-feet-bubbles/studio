/**
 * @fileOverview Analyzes a Detailed Project Report (DPR) using NVIDIA hosted foundation models, incorporating user evaluation criteria.
 *
 * - analyzeDPRImage - A function that initiates the DPR analysis process.
 * - AnalyzeDPRImageInput - The input type for the analyzeDPRImage function.
 * - AnalyzeDPRImageOutput - The return type for the analyzeDPRImage function, including deliberation trace, verdict, risk band, confidence score, and governance action.
 */

import {
  AnalyzeDPRImageInput,
  AnalyzeDPRImageInputSchema,
  AnalyzeDPRImageOutputSchema,
} from "@/ai/flows/schemas";
import {runKurmaSigmaDeliberation} from "@/ai/council/kurmaSigma";

export {
  AnalyzeDPRImageInputSchema,
  AnalyzeDPRImageOutputSchema,
  type AnalyzeDPRImageInput,
  type AnalyzeDPRImageOutput,
} from '@/ai/flows/schemas';

/**
 * Analyzes a DPR text based on user-defined criteria using an NVIDIA LLM.
 */
export async function analyzeDPRImage(input: AnalyzeDPRImageInput) {
  const validated = AnalyzeDPRImageInputSchema.parse(input);
  const output = await runKurmaSigmaDeliberation(validated);
  return AnalyzeDPRImageOutputSchema.parse(output);
}
