"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type AnalysisFormProps = {
  onSubmit: (data: { imageId: string; prompt: string }) => void;
  isLoading: boolean;
};

export default function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(PlaceHolderImages[0]?.id || null);
  const [prompt, setPrompt] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageId) {
      toast({
        variant: "destructive",
        title: "No Image Selected",
        description: "Please select a DPR image to analyze.",
      });
      return;
    }
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Criteria",
        description: "Please provide evaluation criteria for the analysis.",
      });
      return;
    }
    onSubmit({ imageId: selectedImageId, prompt });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Analysis Input</CardTitle>
        <CardDescription>Select an image and provide instructions for the AI council.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">1. Select DPR Image</Label>
            <div className="grid grid-cols-3 gap-3">
              {PlaceHolderImages.map((image) => (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => setSelectedImageId(image.id)}
                  className={cn(
                    "rounded-lg overflow-hidden border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selectedImageId === image.id ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
                  )}
                  aria-pressed={selectedImageId === image.id}
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    width={200}
                    height={150}
                    className="aspect-[4/3] object-cover w-full"
                    data-ai-hint={image.imageHint}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluation-prompt" className="text-base font-medium">2. Enter Evaluation Criteria</Label>
            <Textarea
              id="evaluation-prompt"
              placeholder="e.g., 'Assess the structural integrity and cost-effectiveness of the proposed design...'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] text-base"
              rows={5}
            />
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
