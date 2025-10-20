import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RiskAmberIcon, RiskGreenIcon, RiskRedIcon } from "./icons";
import type { AnalysisResult } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

type RiskIndicatorProps = {
  riskBand: AnalysisResult['riskBand'];
  confidenceScore: AnalysisResult['confidenceScore'];
};

type RiskBandConfig = {
  label: string;
  Icon: LucideIcon;
  badgeClass: string;
  progressClass: string;
  iconClass: string;
};

const riskConfig: Record<AnalysisResult['riskBand'], RiskBandConfig> = {
  GREEN: {
    label: "Low Risk",
    Icon: RiskGreenIcon,
    badgeClass: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
    progressClass: "bg-green-500",
    iconClass: "text-green-500",
  },
  AMBER: {
    label: "Medium Risk",
    Icon: RiskAmberIcon,
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
    progressClass: "bg-yellow-500",
    iconClass: "text-yellow-500",
  },
  RED: {
    label: "High Risk",
    Icon: RiskRedIcon,
    badgeClass: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
    progressClass: "bg-red-500",
    iconClass: "text-red-500",
  },
};

export default function RiskIndicator({ riskBand, confidenceScore }: RiskIndicatorProps) {
  const config = riskConfig[riskBand] || riskConfig.AMBER;

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <config.Icon className={cn("w-8 h-8", config.iconClass)} />
            <div>
              <p className="text-sm text-muted-foreground">Risk Band</p>
              <Badge variant="outline" className={cn("text-lg font-bold py-1 px-3", config.badgeClass)}>
                {config.label}
              </Badge>
            </div>
          </div>
          <div className="sm:w-1/3 w-full">
            <div className="flex justify-between items-baseline mb-1">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="font-bold text-lg text-foreground">{confidenceScore.toFixed(0)}%</p>
            </div>
            <Progress value={confidenceScore} className="h-3 [&>div]:" indicatorClassName={config.progressClass} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to update progress component to accept an indicator class
declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    indicatorClassName?: string;
  }
}
