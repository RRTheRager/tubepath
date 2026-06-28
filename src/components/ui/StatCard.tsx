"use client";

import { Lock } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { Delta } from "./Delta";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  change,
  format = (n) => n.toLocaleString(),
  locked = false,
  onUnlock,
  accent,
}: {
  label: string;
  value: number;
  change?: number;
  format?: (n: number) => string;
  locked?: boolean;
  onUnlock?: () => void;
  accent?: string;
}) {
  return (
    <div className="mac-card relative overflow-hidden p-4">
      {accent && (
        <span
          className="absolute left-0 top-0 h-full w-1"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {typeof change === "number" && !locked && <Delta value={change} />}
      </div>

      {locked ? (
        <button
          onClick={onUnlock}
          className="group mt-2 flex items-center gap-1.5 text-left"
        >
          <span className="select-none text-2xl font-bold blur-[6px]">
            {format(value)}
          </span>
          <Lock className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </button>
      ) : (
        <div className={cn("mt-1.5 text-2xl font-bold tracking-tight tabular-nums")}>
          <AnimatedNumber value={value} format={format} />
        </div>
      )}
    </div>
  );
}
