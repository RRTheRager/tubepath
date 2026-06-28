"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import type { DailyPulse } from "@/lib/types";
import { StreakRing } from "./StreakRing";
import { Delta } from "@/components/ui/Delta";
import { formatRelativeDate } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function PulseHero({
  pulse,
  channelTitle,
  onRefresh,
  refreshing,
}: {
  pulse: DailyPulse;
  channelTitle: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mac-card relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="flex items-center gap-4">
        <StreakRing streak={pulse.streak} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {greeting()}, {channelTitle}
          </p>
          <p className="mt-0.5 text-lg font-semibold leading-snug">
            {pulse.headline}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <PulseStat label="Views today" value={pulse.viewsDelta} />
        <PulseStat label="Engagement" value={pulse.engagementDelta} />
        <div>
          <p className="text-xs text-muted-foreground">New subs</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums">
            {pulse.subscribersDelta >= 0 ? "+" : ""}
            {pulse.subscribersDelta.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Synced {formatRelativeDate(pulse.lastSynced)}
      </p>
    </motion.div>
  );
}

function PulseStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5">
        <Delta value={value} />
      </div>
    </div>
  );
}
