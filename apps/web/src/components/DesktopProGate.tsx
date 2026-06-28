"use client";

import { useEffect, useState } from "react";

/**
 * Pro license gate for native desktop — fetches tier from web API.
 * Free tier users see upgrade prompt when opening desktop shell.
 */
export function DesktopProGate({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsDesktop(ua.includes("tauri") || !!(window as unknown as { __TAURI__?: unknown }).__TAURI__);

    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setTier(d.tier ?? "free"))
      .catch(() => setTier("free"));
  }, []);

  if (!isDesktop) return <>{children}</>;

  if (tier === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (tier !== "pro") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border/50 bg-card/60 p-8 text-center backdrop-blur-md">
          <h1 className="text-2xl font-bold">TubePath Desktop is Pro only</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Upgrade to Pro to use the native desktop app with system tray and offline cache.
          </p>
          <a
            href="/app/settings"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
