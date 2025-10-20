"use client";

import { useEffect, useRef } from "react";
import type { AnalysisResult, CouncilStep, CouncilUpdate } from "@/lib/types";
import { COUNCIL_STEPS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Sparkles } from "lucide-react";
import RiskIndicator from "./risk-indicator";

type AnalysisDisplayProps = {
  result: AnalysisResult | null;
  error: string | null;
  isAnalyzing: boolean;
  progress: CouncilUpdate[];
  elapsedMs: number;
  progressPercent: number;
};

const laneTitles = ["Strategic Path", "Investigation", "Adjudication"];

const stepStyles: Record<CouncilStep, string> = {
  strategist: "border-sky-500/40 bg-sky-500/10",
  skeptic: "border-rose-500/40 bg-rose-500/10",
  researcher: "border-amber-500/40 bg-amber-500/10",
  observation: "border-emerald-500/40 bg-emerald-500/10",
  conductor: "border-indigo-500/40 bg-indigo-500/10",
  judge: "border-purple-500/40 bg-purple-500/10",
  synthesis: "border-primary/40 bg-primary/10",
};

const laneClass = ["md:col-start-1", "md:col-start-2", "md:col-start-3"];

const stepLabel: Record<CouncilStep, string> = {
  strategist: "Strategist",
  skeptic: "Skeptic",
  researcher: "Researcher",
  observation: "Observation",
  conductor: "Conductor",
  judge: "Judge",
  synthesis: "Synthesizer",
};

const formatDuration = (ms: number) => {
  if (ms <= 0) return "00:00.0";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds}.${tenths}`;
};

export default function AnalysisDisplay({ result, error, isAnalyzing, progress, elapsedMs, progressPercent }: AnalysisDisplayProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Analysis Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <StatusCard isAnalyzing={isAnalyzing} elapsedMs={elapsedMs} progressPercent={progressPercent} hasResult={Boolean(result)} />

      <TimelineCard updates={progress} isAnalyzing={isAnalyzing} />

      {isAnalyzing && !result ? <AwaitingOutcomeCard /> : null}

      {result ? <FinalOutcome result={result} /> : null}
    </div>
  );
}

function StatusCard({
  isAnalyzing,
  elapsedMs,
  progressPercent,
  hasResult,
}: {
  isAnalyzing: boolean;
  elapsedMs: number;
  progressPercent: number;
  hasResult: boolean;
}) {
  const statusLabel = isAnalyzing ? "Live" : hasResult ? "Completed" : "Idle";
  const statusTone = isAnalyzing
    ? "bg-amber-100 text-amber-900"
    : hasResult
      ? "bg-emerald-100 text-emerald-900"
      : "bg-muted text-muted-foreground";
  const clampedPercent = Math.max(0, Math.min(100, progressPercent));

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-headline text-2xl">Council Run-Time</CardTitle>
          <CardDescription>
            {isAnalyzing
              ? "Kurma-Σ council is deliberating in real time."
              : hasResult
                ? "Deliberation completed. Review the outcome below."
                : "Launch an analysis to see the agents collaborate."}
          </CardDescription>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", statusTone)}>
          {statusLabel}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Elapsed</span>
          <span className="font-mono text-lg text-foreground">{formatDuration(elapsedMs)}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineCard({ updates, isAnalyzing }: { updates: CouncilUpdate[]; isAnalyzing: boolean }) {
  const pendingSteps = COUNCIL_STEPS.filter((step) => !updates.some((update) => update.step === step));
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (!timelineRef.current) {
      prevLengthRef.current = updates.length;
      return;
    }

    const prevLength = prevLengthRef.current;
    const nextLength = updates.length;
    prevLengthRef.current = nextLength;

    if (nextLength === 0 || nextLength <= prevLength) {
      return;
    }

    const behavior: ScrollBehavior = prevLength === 0 ? "auto" : "smooth";

    requestAnimationFrame(() => {
      const node = timelineRef.current;
      if (!node) return;
      node.scrollTo({ top: node.scrollHeight, behavior });
    });
  }, [updates]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{isAnalyzing ? "Live Council Timeline" : "Deliberation Timeline"}</CardTitle>
        <CardDescription>
          {isAnalyzing
            ? "Watch each agent contribute while the final verdict is prepared."
            : "Replay the branching dialogue that led to the final outcome."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:pb-4">
          {laneTitles.map((title) => (
            <div key={title} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
              {title}
            </div>
          ))}
        </div>
        <div
          ref={timelineRef}
          className="flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1 md:grid md:grid-cols-3 md:gap-4"
        >
          {updates.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-3 w-[80%]" />
              <Skeleton className="mt-2 h-3 w-[60%]" />
            </div>
          ) : (
            <>
              {updates.map((update, index) => (
                <article
                  key={`${update.step}-${index}`}
                  className={cn(
                    "relative rounded-lg border p-4 shadow-sm transition-all",
                    stepStyles[update.step],
                    laneClass[update.lane],
                  )}
                >
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    {stepLabel[update.step]}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-foreground">{update.title}</h3>
                  <p className="mt-2 text-sm font-medium text-foreground/90">{update.summary}</p>
                  {update.detail ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{update.detail}</p>
                  ) : null}
                </article>
              ))}

              {pendingSteps.map((step) => (
                <div
                  key={`pending-${step}`}
                  className={cn(
                    "min-h-[120px] rounded-lg border border-dashed bg-muted/20 p-4",
                    laneClass[laneByStep(step)],
                  )}
                >
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="mt-4 h-3 w-[70%]" />
                  <Skeleton className="mt-2 h-3 w-[55%]" />
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function laneByStep(step: CouncilStep): 0 | 1 | 2 {
  switch (step) {
    case "strategist":
      return 0;
    case "skeptic":
    case "judge":
      return 2;
    default:
      return 1;
  }
}

function AwaitingOutcomeCard() {
  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="rounded-full bg-primary/15 p-2 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-xl">Awaiting Final Verdict</CardTitle>
          <CardDescription>
            The synthesizer is distilling the council&apos;s reasoning into a governance decision. Stay tuned!
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function FinalOutcome({ result }: { result: AnalysisResult }) {
  const { riskBand, confidenceScore, councilVerdict, deliberationTrace, governanceAction } = result;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <RiskIndicator riskBand={riskBand} confidenceScore={confidenceScore} />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Council Verdict</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground">{councilVerdict}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-accent/50 border-accent">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent-foreground">Recommended Governance Action</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-accent-foreground/90">{governanceAction}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Full Deliberation Trace</CardTitle>
          <CardDescription>A verbatim log of the Kurma-Σ council discussion.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            {deliberationTrace}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

