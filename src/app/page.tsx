"use client";

import { useEffect, useRef, useState } from "react";
import AnalysisForm from "@/components/analysis-form";
import AnalysisDisplay from "@/components/analysis-display";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult, AnalysisStreamEvent, CouncilUpdate } from "@/lib/types";
import { COUNCIL_STEP_TOTAL } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Bot } from "lucide-react";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CouncilUpdate[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressTarget, setProgressTarget] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const progressPercentRef = useRef(0);
  const { toast } = useToast();

  useEffect(() => {
    progressPercentRef.current = progressPercent;
  }, [progressPercent]);

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    const interval = window.setInterval(() => {
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 125);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAnalyzing]);

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }
    const timeTarget = Math.min(95, elapsedMs / 120);
    if (!Number.isFinite(timeTarget)) {
      return;
    }
    setProgressTarget((prev) => Math.max(prev, timeTarget));
  }, [elapsedMs, isAnalyzing]);

  useEffect(() => {
    if (Math.abs(progressTarget - progressPercentRef.current) < 0.1) {
      setProgressPercent(progressTarget);
      return;
    }

    let frame = 0;

    const animate = () => {
      setProgressPercent((prev) => {
        const delta = progressTarget - prev;
        if (Math.abs(delta) < 0.1) {
          return progressTarget;
        }
        frame = requestAnimationFrame(animate);
        return prev + delta * 0.08;
      });
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [progressTarget]);

  const handleAnalysis = async ({ reportId, prompt }: { reportId: string; prompt: string }) => {
    if (isAnalyzing) {
      abortControllerRef.current?.abort();
    }

    const selectedReport = PlaceHolderImages.find((report) => report.id === reportId);
    if (!selectedReport) {
      setError("Selected DPR reference not found.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find the selected DPR. Please try again.",
      });
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setProgress([]);
  setProgressPercent(0);
  setProgressTarget(0);
    startTimeRef.current = Date.now();
    setElapsedMs(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId, evaluationCriteria: prompt }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? `Analysis failed with status ${response.status}.`;
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (!completed) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line) {
            try {
              const event = JSON.parse(line) as AnalysisStreamEvent;
              setElapsedMs((prev) => Math.max(prev, event.elapsedMs));

              if (event.kind === "update") {
                setProgress((prev) => {
                  const next = [...prev, event.data];
                  const baseTarget = (next.length / COUNCIL_STEP_TOTAL) * 100;
                  setProgressTarget((prevTarget) => Math.max(prevTarget, Math.min(95, baseTarget)));
                  return next;
                });
              } else if (event.kind === "final") {
                setResult(event.data);
                completed = true;
                setIsAnalyzing(false);
                startTimeRef.current = null;
                setElapsedMs(event.elapsedMs);
                setProgressTarget(100);
              } else if (event.kind === "error") {
                setError(event.message);
                completed = true;
                setIsAnalyzing(false);
                startTimeRef.current = null;
                setElapsedMs(event.elapsedMs);
                setProgressTarget(100);
              }
            } catch (error) {
              console.error("Failed to parse stream event", error);
            }
          }

          newlineIndex = buffer.indexOf("\n");
        }
      }

      if (!completed && !controller.signal.aborted) {
        setIsAnalyzing(false);
        startTimeRef.current = null;
        setProgressTarget((prev) => Math.max(prev, progressPercentRef.current));
      }
    } catch (err) {
      if ((err instanceof DOMException && err.name === "AbortError") || (err as Error)?.message === "The user aborted a request.") {
        // Swallow abort errors when a new request supersedes the previous one.
        return;
      }

      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      setIsAnalyzing(false);
      startTimeRef.current = null;
      setProgressTarget((prev) => Math.max(prev, progressPercentRef.current));
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: message,
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          DPR Insight
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Leverage AI to analyze Detailed Project Reports. Select a summary, provide evaluation criteria, and get an in-depth analysis from a virtual council.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 sticky top-8">
          <AnalysisForm onSubmit={handleAnalysis} isLoading={isAnalyzing} />
        </div>
        <div className="lg:col-span-3">
          {isAnalyzing || result || error ? (
            <AnalysisDisplay
              result={result}
              error={error}
              isAnalyzing={isAnalyzing}
              progress={progress}
              elapsedMs={elapsedMs}
              progressPercent={progressPercent}
            />
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
