"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Youtube } from "lucide-react";
import type { SubscriptionStatus } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Loading } from "@/components/ui/Loading";
import { YouTubeAccountPanel } from "@/components/youtube/YouTubeAccountPanel";

const STATUS_TONE: Record<SubscriptionStatus, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  none: "neutral",
  trialing: "primary",
  active: "success",
  past_due: "warning",
  canceled: "danger",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  none: "No subscription",
  trialing: "Trial (limited)",
  active: "Premium (full)",
  past_due: "Payment due",
  canceled: "Canceled",
};

export default function SettingsPage() {
  const { data, loading, refresh } = useSession();
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <Loading />;

  const { account, capabilities, trialDaysLeft, stripeConfigured, youtubeConfigured } = data;

  const activeGoogle = data.googleAccounts?.find(
    (g) => g.id === data.activeGoogleAccountId
  );
  const googleEmail =
    activeGoogle?.email ??
    data.googleAccounts?.[0]?.email ??
    account.email ??
    null;

  const post = async (url: string, body?: unknown) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader title="Account" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
            {account.name.slice(0, 1)}
          </div>
          <div>
            <p className="font-medium">{account.name}</p>
            <p className="text-sm text-muted-foreground">
              {googleEmail ?? "Not signed in with Google"}
            </p>
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader
          title="Subscription"
          action={<Badge tone={STATUS_TONE[account.status]}>{STATUS_LABEL[account.status]}</Badge>}
        />

        {account.status === "trialing" && (
          <div className="rounded-lg border border-primary/30 bg-primary/8 p-3">
            <p className="text-sm font-medium text-primary">
              {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left in your trial
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Trial gives a limited preview. It converts to full Premium
              automatically unless you cancel.
              {account.cancelAtPeriodEnd && " (Cancellation scheduled.)"}
            </p>
          </div>
        )}

        {account.status === "active" && (
          <p className="text-sm text-muted-foreground">
            You have full Premium access.
            {account.cancelAtPeriodEnd
              ? " Your plan will end at the period close."
              : " Renews automatically."}
          </p>
        )}

        {account.status === "past_due" && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
            <p className="text-sm font-medium text-warning">
              Payment failed &mdash; access limited
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You&apos;ve been moved to limited (trial-level) access. You have{" "}
              <strong>
                {data.graceDaysLeft} day{data.graceDaysLeft === 1 ? "" : "s"}
              </strong>{" "}
              to update your payment before access ends and you&apos;re returned
              to the paywall.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {account.status === "trialing" && (
            <Button onClick={() => post("/api/billing/activate-now")} disabled={busy}>
              Unlock full Premium now
            </Button>
          )}
          {account.status === "past_due" && (
            <Button onClick={() => post("/api/billing/activate-now")} disabled={busy}>
              Fix payment &amp; restore Premium
            </Button>
          )}
          {(account.status === "trialing" || account.status === "active") &&
            !account.cancelAtPeriodEnd && (
              <Button variant="secondary" onClick={() => post("/api/billing/cancel")} disabled={busy}>
                Cancel subscription
              </Button>
            )}
          {account.cancelAtPeriodEnd && (
            <Button variant="secondary" onClick={() => post("/api/billing/resume")} disabled={busy}>
              Resume subscription
            </Button>
          )}
          {stripeConfigured && account.stripeCustomerId && (
            <Button variant="secondary" onClick={() => post("/api/billing/portal")} disabled={busy}>
              <ExternalLink className="h-4 w-4" /> Manage billing
            </Button>
          )}
        </div>
      </Card>

      {/* Connect YouTube */}
      <Card>
        <CardHeader
          title="YouTube channel"
          subtitle={
            account.youtubeConnected
              ? "Switch Google accounts and channels. Managed channels are listed first."
              : "Connect your YouTube channel to load real analytics"
          }
        />
        {account.youtubeConnected || (data.googleAccounts?.length ?? 0) > 0 ? (
          <div className="space-y-4">
            <Badge tone="success">
              <Check className="h-3.5 w-3.5" /> Connected
            </Badge>
            <YouTubeAccountPanel variant="full" />
          </div>
        ) : youtubeConfigured ? (
          <a href="/api/auth/google">
            <Button variant="secondary">
              <Youtube className="h-4 w-4" /> Connect YouTube
            </Button>
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Demo mode. Add Google OAuth keys in <code>.env.local</code> to enable
            real channel connection.
          </p>
        )}
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader title="Appearance" />
        <SegmentedControl
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </Card>

      {/* Dev billing simulator */}
      {!stripeConfigured && (
        <Card className="border-dashed">
          <CardHeader
            title="Billing simulator (dev)"
            subtitle="Stripe isn't configured, so billing is simulated. Preview each access state."
          />
          <div className="flex flex-wrap gap-2">
            {(["none", "trialing", "active", "past_due", "canceled"] as SubscriptionStatus[]).map(
              (s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={account.status === s ? "primary" : "secondary"}
                  onClick={() => post("/api/billing/simulate", { status: s })}
                  disabled={busy}
                >
                  {STATUS_LABEL[s]}
                </Button>
              )
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                post("/api/billing/simulate", {
                  status: "trialing",
                  trialSecondsLeft: 10,
                })
              }
              disabled={busy}
            >
              Trial ends in 10s (test auto-convert)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                post("/api/billing/simulate", {
                  status: "past_due",
                  graceSecondsLeft: 10,
                })
              }
              disabled={busy}
            >
              Grace ends in 10s (test paywall drop)
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Current access level: <strong>{capabilities.level}</strong>
          </p>
        </Card>
      )}
    </div>
  );
}
