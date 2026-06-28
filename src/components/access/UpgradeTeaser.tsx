"use client";

import { Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";

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
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);

  if (enabled) return <>{children}</>;

  const unlock = async () => {
    setBusy(true);
    const res = await fetch("/api/billing/activate-now", { method: "POST" });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else await refresh();
    setBusy(false);
  };

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
        <Button onClick={unlock} disabled={busy} size="sm">
          <Sparkles className="h-4 w-4" />
          Unlock with Premium
        </Button>
      </div>
    </div>
  );
}
