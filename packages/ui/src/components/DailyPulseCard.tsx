"use client";

import { Flame, RefreshCw } from "lucide-react";
import { cn } from "../lib/cn";

interface DailyPulseCardProps {
  headline: string;
  streak: number;
  lastSynced?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DailyPulseCard({
  headline,
  streak,
  lastSynced,
  onRefresh,
  refreshing,
}: DailyPulseCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Daily Pulse
          </p>
          <p className="mt-1 text-base font-medium text-foreground">{headline}</p>
          {lastSynced && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last synced {lastSynced}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
              <Flame className="h-3.5 w-3.5" />
              {streak} day streak
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
