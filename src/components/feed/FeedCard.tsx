"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { InsightCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneAccent: Record<string, string> = {
  positive: "from-success/20 to-transparent",
  negative: "from-danger/20 to-transparent",
  neutral: "from-muted/40 to-transparent",
  tip: "from-primary/20 to-transparent",
};

export function FeedCard({ card, index }: { card: InsightCard; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="mac-card relative overflow-hidden p-5 sm:p-6"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b",
          toneAccent[card.tone] ?? toneAccent.neutral
        )}
      />
      <div className="relative flex items-start gap-4 sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
          {card.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-medium leading-snug sm:text-lg">
              {card.headline}
            </h3>
            {card.ai && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {card.detail}
          </p>
          {card.deltaLabel && (
            <span className="mt-3 inline-block rounded-lg bg-muted px-2.5 py-1 text-sm font-bold tabular-nums">
              {card.deltaLabel}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
