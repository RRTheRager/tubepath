"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Account, GoogleAccountSummary } from "@/lib/types";
import type { Capabilities } from "@/lib/access";

export interface SessionData {
  account: Account;
  googleAccounts: GoogleAccountSummary[];
  activeGoogleAccountId: string | null;
  capabilities: Capabilities;
  trialDaysLeft: number;
  graceDaysLeft: number;
  stripeConfigured: boolean;
  aiConfigured: boolean;
  youtubeConfigured: boolean;
}

interface SessionCtx {
  data: SessionData | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const json = (await res.json()) as SessionData;
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ data, loading, refresh }}>{children}</Ctx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

/** Convenience hook for capabilities with a safe default. */
export function useAccess() {
  const { data } = useSession();
  return data?.capabilities ?? null;
}
