"use client";

import { useEffect, useState } from "react";

export function SettingsPage() {
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [email, setEmail] = useState("");
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        setTier(d.tier ?? "free");
        setEmail(d.email ?? "");
        setDemo(d.demo ?? true);
      });

    const params = new URLSearchParams(window.location.search);
    if (params.get("tier") === "pro") {
      fetch("/api/session/demo-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro" }),
      }).then(() => setTier("pro"));
    }
  }, []);

  const handleUpgrade = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url, demo: isDemoCheckout } = await res.json();
    if (url) window.location.href = url;
    else if (isDemoCheckout) {
      await fetch("/api/session/demo-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro" }),
      });
      setTier("pro");
    }
  };

  const handleManage = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-xl border border-border/50 bg-card/40 p-6">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">{email || "demo@tubepath.app"}</p>
        {demo && (
          <p className="mt-2 text-xs text-warning">
            Demo mode — configure .env.local for production auth.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border/50 bg-card/40 p-6">
        <h2 className="font-semibold">Subscription</h2>
        <p className="mt-2 text-sm">
          Current plan:{" "}
          <span className="font-semibold capitalize text-primary">{tier}</span>
        </p>
        {tier === "free" ? (
          <button
            type="button"
            onClick={handleUpgrade}
            className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Upgrade to Pro
          </button>
        ) : (
          <button
            type="button"
            onClick={handleManage}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm"
          >
            Manage billing
          </button>
        )}
        {demo && tier === "free" && (
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/session/demo-tier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: "pro" }),
              });
              setTier("pro");
            }}
            className="ml-3 mt-4 rounded-lg border border-border px-4 py-2 text-sm"
          >
            Try Pro (demo)
          </button>
        )}
      </section>

      <section className="rounded-xl border border-border/50 bg-card/40 p-6">
        <h2 className="font-semibold">API setup</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          See <code className="text-primary">docs/api-setup.md</code> for Google Cloud,
          Supabase, Gemini, and Stripe configuration.
        </p>
      </section>
    </div>
  );
}
