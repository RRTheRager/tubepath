"use client";

import { motion } from "framer-motion";
import type { TrafficStage } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export function PipelineFunnel({
  stages,
  blurred = false,
}: {
  stages: TrafficStage[];
  blurred?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative space-y-3",
        blurred && "pointer-events-none select-none blur-[6px] saturate-50"
      )}
    >
      {stages.map((stage, i) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="relative"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
              style={{ opacity: 0.4 + (stage.pct / 100) * 0.6 }}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{stage.label}</p>
                <span className="text-sm font-bold tabular-nums text-primary">
                  {stage.pct}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stage.description}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${Math.min(100, stage.pct)}%` }}
                />
              </div>
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className="ml-5 h-4 border-l border-dashed border-border/80" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
