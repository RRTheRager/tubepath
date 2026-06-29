"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { OverviewPayload } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { useActivatePremium } from "@/components/access/useActivatePremium";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatCompact } from "@/lib/utils";

type Horizon = "7" | "30" | "90";

function forecastViews(metrics: OverviewPayload["metrics"], days: number) {
  const recent = metrics.slice(-14);
  if (recent.length < 7) return null;
  const avgDaily = recent.reduce((a, d) => a + d.views, 0) / recent.length;
  const projected = Math.round(avgDaily * days);
  const low = Math.round(projected * (days >= 30 ? 0.65 : 0.85));
  const high = Math.round(projected * (days >= 30 ? 1.45 : 1.15));
  return { projected, low, high, avgDaily };
}

export default function GrowthPage() {
  const { data: session } = useSession();
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const { activate, busy } = useActivatePremium();
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [horizon, setHorizon] = useState<Horizon>("7");
  const [loading, setLoading] = useState(true);

  const isFull = session?.capabilities.level === "full";
  const locked = !isFull && horizon !== "7";

  useEffect(() => {
    if (!hasChannel) {
      setLoading(false);
      return;
    }
    fetch("/api/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.overview && setOverview(j.overview))
      .finally(() => setLoading(false));
  }, [hasChannel]);

  if (ytLoading || (hasChannel && loading)) {
    return <Loading label="Building forecast" />;
  }

  if (!hasChannel) return <YouTubeConnectPrompt variant="select-channel" />;

  if (!overview) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Connect YouTube and gather at least 14 days of data for projections.
      </p>
    );
  }

  const dataDays = overview.metrics.length;
  const days = Number(horizon);
  const minRequired = Math.max(14, Math.floor(days / 2));
  const canForecast = dataDays >= minRequired;
  const fc = canForecast ? forecastViews(overview.metrics, days) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <TrendingUp className="h-6 w-6 text-primary" /> Projected Growth
          <Badge tone="primary">Beta</Badge>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Experimental forecasts from your recent performance. Not financial
          advice.
        </p>
        {dataDays < 14 && (
          <p className="mt-2 text-xs text-warning">
            Need at least 14 days of history ({dataDays} available).
          </p>
        )}
      </div>

      <SegmentedControl
        options={[
          { value: "7", label: "7d" },
          { value: "30", label: "30d" },
          { value: "90", label: "90d" },
        ]}
        value={horizon}
        onChange={setHorizon}
      />

      {locked ? (
        <Card className="text-center">
          <CardHeader title="Premium forecast" />
          <p className="text-sm text-muted-foreground">
            7-day projections are included in your trial. Upgrade for 30/90-day
            forecasts with wider uncertainty bands.
          </p>
          <Button className="mt-4" onClick={activate} disabled={busy}>
            Unlock with Premium
          </Button>
        </Card>
      ) : !canForecast ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Need at least {minRequired} days of history for a {days}-day forecast.
        </Card>
      ) : fc ? (
        <Card>
          <CardHeader title={`${days}-day view projection`} />
          <p className="text-3xl font-bold tabular-nums">
            {formatCompact(fc.projected)} views
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Range: {formatCompact(fc.low)} – {formatCompact(fc.high)}
            {days >= 30 && " (beta — wider uncertainty)"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Based on ~{formatCompact(fc.avgDaily)}/day from your last 14 days.
            RPM/revenue projections require a monetized channel (coming soon).
          </p>
        </Card>
      ) : null}
    </div>
  );
}
