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

const AnalyzeDPRImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'A DPR image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Ensure correct MIME type and Base64 encoding
    ),
  evaluationCriteria: z
    .string()
    .describe('User-provided criteria or instructions for evaluating the DPR image.'), // Clear description of the input's purpose
});
export type AnalyzeDPRImageInput = z.infer<typeof AnalyzeDPRImageInputSchema>;

const AnalyzeDPRImageOutputSchema = z.object({
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
    .number()
    .describe('A numerical score indicating the AI\'s confidence in its analysis and verdict.'), // Confidence score
  governanceAction: z
    .string()
    .describe('Recommended governance action based on the analysis.'), // Governance action
});
export type AnalyzeDPRImageOutput = z.infer<typeof AnalyzeDPRImageOutputSchema>;


const askUser = ai.defineTool({
  name: 'ask_user',
  description: 'Incorporate the user\'s input into the final deliberation.',
  inputSchema: z.object({
    user_input: z.string().describe('The user\'s evaluation criteria.'),
  }),
  outputSchema: z.string(),
},
async (input) => {
  // This tool simply returns the user input for incorporation into the prompt.
  return input.user_input;
});


export async function analyzeDPRImage(input: AnalyzeDPRImageInput): Promise<AnalyzeDPRImageOutput> {
  return analyzeDPRImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDPRImagePrompt',
  input: {schema: AnalyzeDPRImageInputSchema},
  output: {schema: AnalyzeDPRImageOutputSchema},
  tools: [askUser],
  prompt: `You are a council deliberating on a Detailed Project Report (DPR) image.

Your goal is to analyze the image based on user-provided evaluation criteria, mimicking a council\'s deliberation process.

You will act as four distinct council members:

Creator: Provides the initial project details and background.
Critic: Critically evaluates the project, identifying potential risks and weaknesses.
Worker: Proposes solutions and improvements to address the identified risks.
Justice: Synthesizes the council\'s input, delivering a final verdict and recommended governance action.

Incorporate the user\'s evaluation criteria using the ask_user tool.

Analyze the following DPR image: {{media url=imageDataUri}}

Evaluation Criteria (provided by the user): {{ask_user user_input=evaluationCriteria}}


Structure your response as follows:

Deliberation Trace: A detailed log of each council member\'s contribution.
Council Verdict: The final verdict or recommendation.
Risk Band: The assessed risk level (RED, AMBER, or GREEN).
Confidence Score: A numerical score (0-100) indicating the AI\'s confidence in its analysis.
Governance Action: Recommended governance action.

Ensure that the deliberation trace includes specific points raised by each council member (Creator, Critic, Worker, Justice), the council verdict summarizes the discussion and arrives at a decision, the risk band categorizes the overall project risk (RED, AMBER, GREEN) based on the deliberations, the confidence score reflects how certain the council is in its assessment, and the governance action outlines specific steps to be taken as a result of the analysis.

Your output MUST conform to the AnalyzeDPRImageOutputSchema. The \"deliberationTrace\", \"councilVerdict\", and \"governanceAction\" fields MUST be strings. The \"riskBand\" field MUST be one of \"RED\", \"AMBER\", or \"GREEN\". The \"confidenceScore\" field MUST be a number between 0 and 100.
`,
});

const analyzeDPRImageFlow = ai.defineFlow(
  {
    name: 'analyzeDPRImageFlow',
    inputSchema: AnalyzeDPRImageInputSchema,
    outputSchema: AnalyzeDPRImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
