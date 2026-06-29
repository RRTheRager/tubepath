"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";

export function useActivatePremium() {
  const { refresh } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/activate-now", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Could not unlock Premium. Try again.");
        return;
      }
      await refresh();
      router.refresh();
    } catch {
      setError("Could not unlock Premium. Try again.");
    } finally {
      setBusy(false);
    }
  }, [refresh, router]);

  return { activate, busy, error };
}
