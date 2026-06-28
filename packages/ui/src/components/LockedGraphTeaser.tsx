"use client";

import { Lock, Sparkles } from "lucide-react";
import { cn } from "../lib/cn";

interface LockedGraphTeaserProps {
  title: string;
  teaserText: string;
  onUpgrade?: () => void;
  className?: string;
}

export function LockedGraphTeaser({
  title,
  teaserText,
  onUpgrade,
  className,
}: LockedGraphTeaserProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-md",
        className
      )}
    >
      <div className="pointer-events-none select-none blur-sm">
        <div className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
          <div className="flex h-[220px] items-end gap-1 px-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/30"
                style={{ height: `${30 + Math.sin(i * 0.5) * 25 + Math.random() * 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
        <Lock className="h-6 w-6 text-primary" />
        <p className="max-w-xs text-center text-sm font-medium text-foreground">
          {teaserText}
        </p>
        {onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </button>
        )}
      </div>
    </div>
  );
}
