"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export function StreakRing({ streak }: { streak: number }) {
  const max = 7;
  const pct = Math.min(streak / max, 1);
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="hsl(var(--warning))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * pct }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Flame className="h-4 w-4 text-warning" />
        <span className="text-xs font-bold tabular-nums">{streak}</span>
      </div>
    </div>
  );
}
