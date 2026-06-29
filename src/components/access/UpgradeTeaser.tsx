"use client";

import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useActivatePremium } from "./useActivatePremium";

/**
 * Wrap premium-only content. During the trial (limited access) the children are
 * blurred behind a tasteful "unlock" overlay rather than hidden, so the trial
 * feels usable-but-worse and motivates conversion.
 */
export function UpgradeTeaser({
  enabled,
  title,
  description,
  children,
  minHeight = 200,
}: {
  enabled: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
  minHeight?: number;
}) {
  const { activate, busy, error } = useActivatePremium();

  if (enabled) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ minHeight }}>
      <div className="pointer-events-none select-none blur-[7px] saturate-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/55 p-6 text-center backdrop-blur-[2px]">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Button onClick={activate} disabled={busy} size="sm">
          <Sparkles className="h-4 w-4" />
          Unlock with Premium
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
