"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function StartTrialButton({
  className,
  label = "Start 3-day free trial",
  size = "lg",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/start-trial", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url; // Stripe Checkout
      } else {
        router.push(json.redirect ?? "/app");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      onClick={start}
      disabled={busy}
      className={cn("group", className)}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </Button>
  );
}
