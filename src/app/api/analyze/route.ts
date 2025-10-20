import { NextResponse } from "next/server";
import { runKurmaSigmaDeliberation } from "@/ai/council/kurmaSigma";
import { AnalyzeDPRImageInputSchema } from "@/ai/flows/analyze-dpr-image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { AnalysisStreamEvent } from "@/lib/types";

const textEncoder = new TextEncoder();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, evaluationCriteria } = body ?? {};

    if (typeof reportId !== "string" || typeof evaluationCriteria !== "string") {
      return NextResponse.json({ error: "reportId and evaluationCriteria are required." }, { status: 400 });
    }

    const selectedReport = PlaceHolderImages.find((report) => report.id === reportId);
    if (!selectedReport) {
      return NextResponse.json({ error: "Selected DPR reference was not found." }, { status: 404 });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const startTime = Date.now();
        const enqueue = (event: AnalysisStreamEvent) => {
          controller.enqueue(textEncoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          const input = AnalyzeDPRImageInputSchema.parse({
            reportText: selectedReport.reportText,
            evaluationCriteria,
          });

          const result = await runKurmaSigmaDeliberation(input, (update, elapsedMs) => {
            enqueue({ kind: "update", data: update, elapsedMs });
          });

          enqueue({ kind: "final", data: result, elapsedMs: Date.now() - startTime });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          enqueue({ kind: "error", message, elapsedMs: Date.now() - startTime });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
