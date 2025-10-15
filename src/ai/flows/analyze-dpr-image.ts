'use server';

/**
 * @fileOverview Analyzes a DPR (Detailed Project Report) image using Gemini, incorporating user evaluation criteria.
 *
 * - analyzeDPRImage - A function that initiates the DPR image analysis process.
 * - AnalyzeDPRImageInput - The input type for the analyzeDPRImage function.
 * - AnalyzeDPRImageOutput - The return type for the analyzeDPRImage function, including deliberation trace, verdict, risk band, confidence score, and governance action.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {defineFlow} from 'genkit/flow';

/**
 * The input for the DPR image analysis flow.
 */
export const AnalyzeDPRImageInputSchema = z.object({
  imageDataUri: z.string().describe('The data URI of the image to analyze.'), // Added for clarity and type safety
  evaluationCriteria: z.string().describe('The user-provided criteria for evaluating the DPR image.'),
});
export type AnalyzeDPRImageInput = z.infer<typeof AnalyzeDPRImageInputSchema>;

/**
 * The output for the DPR image analysis flow.
 */
export const AnalyzeDPRImageOutputSchema = z.object({
  deliberationTrace: z
    .string()
    .describe('A detailed trace of the AI deliberation process, including all council member contributions.'), // Comprehensive trace description
  councilVerdict: z
    .string()
    .describe('The final verdict or recommendation from the AI council.'), // Clear description of the verdict
  riskBand: z
    .string()
    .describe('The assessed risk level, categorized as RED, AMBER, or GREEN.'), // Specific risk levels
  confidenceScore: z
    .number().min(0).max(100)
    .describe('A numerical score indicating the AI\'s confidence in its analysis and verdict.'), // Confidence score
  governanceAction: z
    .string()
    .describe('Recommended governance action based on the analysis.'), // Governance action
});
export type AnalyzeDPRImageOutput = z.infer<typeof AnalyzeDPRImageOutputSchema>;

/**
 * A Genkit flow that analyzes a DPR image based on user-defined criteria.
 */
export const analyzeDPRImage = defineFlow(
  {
    name: 'analyzeDPRImage',
    inputSchema: AnalyzeDPRImageInputSchema,
    outputSchema: AnalyzeDPRImageOutputSchema,
    authPolicy: (auth, input) => {
      // This is a placeholder for your own authentication logic.
      // For this example, we'll allow all requests.
      return;
    },
  },
  async ({imageDataUri, evaluationCriteria}) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `
      You are an expert council of AI agents, each with a specific role, tasked with analyzing a Detailed Project Report (DPR) image.
      Your goal is to provide a comprehensive analysis based on the provided image and user-defined evaluation criteria.

      The council members are:
      - **Creator**: Focuses on the positive aspects, potential, and opportunities.
      - **Critic**: Identifies risks, flaws, and potential downsides.
      - **Worker**: Provides a neutral, data-driven perspective based on the facts presented in the image.
      - **Justice**: Ensures fairness, ethical considerations, and a balanced final judgment.

      **Your Task:**
      1.  Analyze the attached DPR image (\`imageDataUri\`).
      2.  Consider the user's evaluation criteria: "${evaluationCriteria}".
      3.  Conduct a simulated deliberation where each council member provides their input.
      4.  Based on the deliberation, provide a final verdict, assess the risk, and recommend a governance action.

      **Output Format:**
      Your final output must be a single JSON object that conforms to the 'AnalyzeDPRImageOutputSchema'.
      Ensure that the deliberation trace includes specific points raised by each council member (Creator, Critic, Worker, Justice), the council verdict summarizes the discussion and arrives at a decision, the risk band categorizes the overall project risk (RED, AMBER, GREEN) based on the deliberations, the confidence score reflects how certain the council is in its assessment, and the governance action outlines specific steps to be taken as a result of the analysis.
      
      Your output MUST conform to the AnalyzeDPRImageOutputSchema. The "deliberationTrace", "councilVerdict", and "governanceAction" fields MUST be strings. The "riskBand" field MUST be one of "RED", "AMBER", or "GREEN". The "confidenceScore" field MUST be a number between 0 and 100.
      `,
      output: {format: 'json', schema: AnalyzeDPRImageOutputSchema},
      context: {
        // You can add any additional context here, such as user information, session IDs, etc.
      },
      // Attach the image for analysis
      media: [{uri: imageDataUri}],
    });
    return llmResponse.output();
  },
);
