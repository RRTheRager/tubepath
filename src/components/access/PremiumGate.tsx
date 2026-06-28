"use client";

import { useState } from "react";
import { Sparkles, Lock } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";

export function PremiumGate({
  title,
  description,
  perks,
}: {
  title: string;
  description: string;
  perks: string[];
}) {
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    setBusy(true);
    const res = await fetch("/api/billing/activate-now", { method: "POST" });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else await refresh();
    setBusy(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mac-card max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-6 w-full" onClick={unlock} disabled={busy}>
          <Sparkles className="h-4 w-4" /> Unlock with Premium
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Ends your trial early and starts your subscription.
        </p>
      </div>
    </div>
  );
}
