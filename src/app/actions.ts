"use server";

import { analyzeDPRImage, type AnalyzeDPRImageInput } from "@/ai/flows/analyze-dpr-image";
import { z } from "zod";
import { promises as fs } from 'fs';
import path from 'path';

const ActionInputSchema = z.object({
  imageUrl: z.string(),
  evaluationCriteria: z.string().min(10, "Evaluation criteria must be at least 10 characters long."),
});

async function imageUrlToDataUri(url: string): Promise<string> {
  try {
    const imagePath = path.join(process.cwd(), 'public', url);
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    const ext = path.extname(url).toLowerCase();
    let contentType;
    switch (ext) {
        case '.webp':
            contentType = 'image/webp';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        default:
            contentType = 'application/octet-stream';
    }

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
