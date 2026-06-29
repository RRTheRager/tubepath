"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, X } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";
import { useActivatePremium } from "./useActivatePremium";

export function TrialBanner() {
  const { data } = useSession();
  const { activate, busy } = useActivatePremium();
  const [dismissed, setDismissed] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  if (!data || dismissed) return null;

  const { status } = data.account;

  const fixPayment = async () => {
    setPortalBusy(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    setPortalBusy(false);
  };

  if (status === "trialing") {
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-sm md:flex-nowrap md:px-6">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-foreground">
          <span className="font-semibold">{data.trialDaysLeft} day{data.trialDaysLeft === 1 ? "" : "s"} left</span>{" "}
          in your trial. AI + advanced analytics unlock when it converts.
        </p>
        <Button size="sm" onClick={activate} disabled={busy}>
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
      <div className="flex flex-wrap items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm md:flex-nowrap md:px-6">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        <p className="min-w-0 flex-1">
          Payment failed &mdash; you&apos;ve been moved to limited access.{" "}
          <span className="font-semibold">
            {data.graceDaysLeft} day{data.graceDaysLeft === 1 ? "" : "s"} left
          </span>{" "}
          to fix it before access ends.
        </p>
        <Button size="sm" variant="secondary" onClick={fixPayment} disabled={portalBusy}>
          Fix payment
        </Button>
      </div>
    );
  }

  return null;
}
