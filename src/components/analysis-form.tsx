"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AnalysisFormProps = {
  onSubmit: (data: { reportId: string; prompt: string }) => void;
  isLoading: boolean;
};

const DEFAULT_PROMPT = "Assess and analyse this document.";

export default function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(PlaceHolderImages[0]?.id || null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) {
      toast({
        variant: "destructive",
        title: "No DPR Selected",
        description: "Please select a DPR summary to analyze.",
      });
      return;
    }
    onSubmit({ reportId: selectedReportId, prompt: DEFAULT_PROMPT });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Analysis Input</CardTitle>
        <CardDescription>Select a DPR reference and provide evaluation criteria for the council.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">1. Select DPR Reference</Label>
            <div className="grid grid-cols-3 gap-3">
              {PlaceHolderImages.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setSelectedReportId(option.id)}
                  className={cn(
                    "rounded-lg overflow-hidden border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selectedReportId === option.id ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
                  )}
                  aria-pressed={selectedReportId === option.id}
                >
                  <Image
                    src={option.imageUrl}
                    alt={option.description}
                    width={200}
                    height={150}
                    className="aspect-[4/3] object-cover w-full"
                    data-ai-hint={option.imageHint}
                  />
                  <div className="p-3 text-left bg-background">
                    <p className="text-sm font-semibold leading-snug text-foreground/90">
                      {option.title ?? option.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">2. Evaluation Criteria</Label>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              {DEFAULT_PROMPT}
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
