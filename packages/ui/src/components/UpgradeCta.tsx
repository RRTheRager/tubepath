"use client";

import { Sparkles } from "lucide-react";

interface UpgradeCtaProps {
  onUpgrade: () => void;
}

export function UpgradeCta({ onUpgrade }: UpgradeCtaProps) {
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Unlock full analytics with Pro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            All metric graphs, spike detection, AI optimizer, competitors, pipeline, and native apps.
          </p>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade
        </button>
      </div>
    </div>
  );
}
