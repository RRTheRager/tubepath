"use client";

import type { MetricTip } from "@tubepath/core";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";

interface AiTipPanelProps {
  tip: MetricTip | null;
  open: boolean;
  onClose: () => void;
}

export function AiTipPanel({ tip, open, onClose }: AiTipPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!open || !tip) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed z-50 border-border bg-card shadow-2xl",
          "bottom-0 left-0 right-0 rounded-t-2xl border-t p-6 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[400px] md:rounded-none md:border-l md:rounded-tl-2xl"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Coach
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{tip.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium"
        >
          Why & what to do
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-4">
            {tip.causes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Likely causes
                </p>
                <ul className="space-y-1">
                  {tip.causes.map((c, i) => (
                    <li key={i} className="text-sm text-foreground">
                      • {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tip.actions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Do this next
                </p>
                <ul className="space-y-1">
                  {tip.actions.map((a, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {i + 1}. {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
