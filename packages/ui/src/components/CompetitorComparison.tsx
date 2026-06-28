"use client";

import type { CompetitorChannel } from "@tubepath/core";
import { MetricChart, type ChartDataPoint } from "./MetricChart";
import { cn } from "../lib/cn";

interface CompetitorComparisonProps {
  yourData: ChartDataPoint[];
  competitor: CompetitorChannel;
  competitorData: ChartDataPoint[];
  className?: string;
}

export function CompetitorComparison({
  yourData,
  competitor,
  competitorData,
  className,
}: CompetitorComparisonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        {competitor.thumbnailUrl && (
          <img src={competitor.thumbnailUrl} alt="" className="h-10 w-10 rounded-full" />
        )}
        <div>
          <p className="font-semibold text-foreground">{competitor.nickname || competitor.title}</p>
          <p className="text-xs text-muted-foreground">
            Public data only • {competitor.subscriberCount.toLocaleString()} subs
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricChart data={yourData} title="Your views" color="hsl(210, 100%, 60%)" />
        <MetricChart
          data={competitorData}
          title={`${competitor.title} views`}
          color="hsl(30, 100%, 55%)"
        />
      </div>
    </div>
  );
}
