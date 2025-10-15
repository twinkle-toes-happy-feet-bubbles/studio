"use server";

import { analyzeDPRImage, type AnalyzeDPRImageInput } from "@/ai/flows/analyze-dpr-image";
import { z } from "zod";

const ActionInputSchema = z.object({
  imageUrl: z.string().url(),
  evaluationCriteria: z.string().min(10, "Evaluation criteria must be at least 10 characters long."),
});

async function imageUrlToDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType) {
      throw new Error("Could not determine image content type.");
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image URL to data URI:", error);
    throw new Error("Failed to process image from URL.");
  }
}

export async function performAnalysis(input: z.infer<typeof ActionInputSchema>) {
  const validatedInput = ActionInputSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new Error(validatedInput.error.errors.map(e => e.message).join(', '));
  }

  const { imageUrl, evaluationCriteria } = validatedInput.data;

  const imageDataUri = await imageUrlToDataUri(imageUrl);

  const analysisInput: AnalyzeDPRImageInput = {
    imageDataUri,
    evaluationCriteria,
  };

  try {
    const result = await analyzeDPRImage(analysisInput);
    return result;
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error("The AI analysis failed to produce a result. Please try again.");
  }
}
