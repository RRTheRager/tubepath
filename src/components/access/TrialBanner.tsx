"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, X } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";

export function TrialBanner() {
  const { data, refresh } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!data || dismissed) return null;

  const { status } = data.account;

  const activateNow = async () => {
    setBusy(true);
    const res = await fetch("/api/billing/activate-now", { method: "POST" });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else await refresh();
    setBusy(false);
  };

  const fixPayment = async () => {
    setBusy(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    setBusy(false);
  };

  if (status === "trialing") {
    return (
      <div className="flex items-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm md:px-6">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-foreground">
          <span className="font-semibold">{data.trialDaysLeft} day{data.trialDaysLeft === 1 ? "" : "s"} left</span>{" "}
          in your trial. AI + advanced analytics unlock when it converts.
        </p>
        <Button size="sm" onClick={activateNow} disabled={busy}>
          Unlock now
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (status === "past_due") {
    return (
      <div className="flex items-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm md:px-6">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        <p className="flex-1">
          Payment failed &mdash; you&apos;ve been moved to limited access.{" "}
          <span className="font-semibold">
            {data.graceDaysLeft} day{data.graceDaysLeft === 1 ? "" : "s"} left
          </span>{" "}
          to fix it before access ends.
        </p>
        <Button size="sm" variant="secondary" onClick={fixPayment} disabled={busy}>
          Fix payment
        </Button>
      </div>
    );
  }

  return null;
}
