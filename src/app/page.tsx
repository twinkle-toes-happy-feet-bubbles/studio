"use client";

import { useState } from "react";
import AnalysisForm from "@/components/analysis-form";
import AnalysisDisplay from "@/components/analysis-display";
import { performAnalysis } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@/lib/types";
import { PlaceHolderImages, type ImagePlaceholder } from "@/lib/placeholder-images";
import { Bot } from "lucide-react";

type AnalysisState = {
  isLoading: boolean;
  data: AnalysisResult | null;
  error: string | null;
};

export default function Home() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    data: null,
    error: null,
  });
  const { toast } = useToast();

  const handleAnalysis = async ({ imageId, prompt }: { imageId: string; prompt: string }) => {
    setAnalysisState({ isLoading: true, data: null, error: null });

    const selectedImage = PlaceHolderImages.find(img => img.id === imageId);

    if (!selectedImage) {
      setAnalysisState({
        isLoading: false,
        data: null,
        error: "Selected image not found.",
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find the selected image. Please try again.",
      });
      return;
    }

    try {
      const result = await performAnalysis({
        imageUrl: selectedImage.imageUrl,
        evaluationCriteria: prompt,
      });

      if (result) {
        setAnalysisState({ isLoading: false, data: result, error: null });
      } else {
        throw new Error("Analysis returned no result.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setAnalysisState({ isLoading: false, data: null, error: errorMessage });
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: errorMessage,
      });
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          DPR Insight
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Leverage AI to analyze Detailed Project Reports. Select an image, provide evaluation criteria, and get an in-depth analysis from a virtual council.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 sticky top-8">
          <AnalysisForm onSubmit={handleAnalysis} isLoading={analysisState.isLoading} />
        </div>
        <div className="lg:col-span-3">
          {analysisState.isLoading || analysisState.data || analysisState.error ? (
            <AnalysisDisplay state={analysisState} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-card border border-dashed rounded-xl p-8 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Bot className="w-12 h-12 text-primary" />
              </div>
              <h2 className="font-headline text-2xl font-semibold">Analysis Results</h2>
              <p className="text-muted-foreground mt-2">
                Your detailed DPR analysis will appear here once you submit a request.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
