"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { trendDirection } from "@tubepath/core";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "../lib/cn";

interface HeroEngagementProps {
  rate: number;
  change: number;
}

export function HeroEngagement({ rate, change }: HeroEngagementProps) {
  const trend = trendDirection(change);
  const TrendIcon =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card/80 p-6 backdrop-blur-md">
      <p className="mb-1 text-sm font-medium text-muted-foreground">
        Engagement rate
        <span
          className="ml-1 cursor-help text-xs"
          title="Likes + comments divided by views"
        >
          (?)
        </span>
      </p>
      <div className="flex items-end gap-3">
        <AnimatedNumber
          value={rate}
          format={(n) => `${n.toFixed(2)}%`}
          className="text-5xl font-bold tabular-nums tracking-tight text-foreground md:text-6xl"
        />
        <div
          className={cn(
            "mb-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold",
            trend === "up" && "bg-success/15 text-success",
            trend === "down" && "bg-danger/15 text-danger",
            trend === "flat" && "bg-muted text-muted-foreground"
          )}
        >
          <TrendIcon className="h-4 w-4" />
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}%
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Your most important metric — how much viewers interact with your content.
      </p>
    </div>
  );
}
