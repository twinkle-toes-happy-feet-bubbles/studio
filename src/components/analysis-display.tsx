"use client";

import type { AnalysisResult } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import RiskIndicator from "./risk-indicator";
import { CreatorIcon, CriticIcon, JusticeIcon, WorkerIcon } from "./icons";

type AnalysisDisplayProps = {
  state: {
    isLoading: boolean;
    data: AnalysisResult | null;
    error: string | null;
  };
};

type CouncilMember = 'Creator' | 'Critic' | 'Worker' | 'Justice' | 'Unknown';

const CouncilMemberInfo: Record<CouncilMember, { icon: React.ElementType, color: string }> = {
  Creator: { icon: CreatorIcon, color: "text-blue-500" },
  Critic: { icon: CriticIcon, color: "text-red-500" },
  Worker: { icon: WorkerIcon, color: "text-yellow-500" },
  Justice: { icon: JusticeIcon, color: "text-purple-500" },
  Unknown: { icon: () => null, color: "" },
};

const parseDeliberation = (trace: string) => {
  return trace.split('\n').map((line, index) => {
    const [role, ...rest] = line.split(':');
    const member = role.trim() as CouncilMember;
    const content = rest.join(':').trim();
    if (Object.keys(CouncilMemberInfo).includes(member) && content) {
      return { id: index, role: member, content };
    }
    return null;
  }).filter(Boolean);
};

export default function AnalysisDisplay({ state }: AnalysisDisplayProps) {
  if (state.isLoading) {
    return <LoadingSkeleton />;
  }

  if (state.error) {
    return (
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Analysis Error</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  if (!state.data) {
    return null;
  }

  const { riskBand, confidenceScore, councilVerdict, deliberationTrace, governanceAction } = state.data;
  const deliberation = parseDeliberation(deliberationTrace);

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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Deliberation Trace</CardTitle>
          <CardDescription>Follow the AI council's discussion and reasoning process.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {deliberation.map((item) => {
              if (!item) return null;
              const { icon: Icon, color } = CouncilMemberInfo[item.role];
              return (
                <AccordionItem key={item.id} value={`item-${item.id}`}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-6 h-6", color)} />
                      {item.role}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pl-12">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
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
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-full mt-4" />
        </CardContent>
      </Card>
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
