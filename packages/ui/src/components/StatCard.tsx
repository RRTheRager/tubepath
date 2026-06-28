"use client";

import type { MetricKey } from "@tubepath/core";
import { formatMetricValue, trendDirection } from "@tubepath/core";
import { ArrowDown, ArrowUp, Minus, Lock } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "../lib/cn";

interface StatCardProps {
  label: string;
  metricKey: MetricKey;
  value: number;
  change?: number;
  locked?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export function StatCard({
  label,
  metricKey,
  value,
  change = 0,
  locked = false,
  onClick,
  tooltip,
}: StatCardProps) {
  const trend = trendDirection(change);
  const TrendIcon =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={tooltip}
      className={cn(
        "relative flex flex-col gap-1 rounded-xl border border-border/50 bg-card/60 p-4 text-left backdrop-blur-md transition-all",
        onClick && "cursor-pointer hover:border-primary/40 hover:bg-card/80",
        locked && "overflow-hidden"
      )}
    >
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <AnimatedNumber
        value={value}
        format={(n) => formatMetricValue(metricKey, n)}
        className="text-2xl font-bold tabular-nums text-foreground"
      />
      <div
        className={cn(
          "flex items-center gap-1 text-sm font-medium",
          trend === "up" && "text-success",
          trend === "down" && "text-danger",
          trend === "flat" && "text-muted-foreground"
        )}
      >
        <TrendIcon className="h-3.5 w-3.5" />
        <span>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
      </div>
    </button>
  );
}
