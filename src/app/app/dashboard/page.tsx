"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { DailyMetric, MetricKey, OverviewPayload } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataNotice } from "@/components/ui/DataNotice";
import { MetricChart, type ChartPoint } from "@/components/charts/MetricChart";
import { UpgradeTeaser } from "@/components/access/UpgradeTeaser";
import { Loading } from "@/components/ui/Loading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AnomalyList } from "@/components/dashboard/AnomalyList";
import { StudioAnalyticsPanel } from "@/components/analytics/StudioAnalyticsPanel";
import { StudioTabBar, type StudioTab } from "@/components/analytics/StudioTabBar";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { formatCompact } from "@/lib/utils";

type Range = "7" | "28" | "90";

const CHART_COLOR = "hsl(0 100% 50%)";

function toChart(metrics: DailyMetric[], key: MetricKey, days: number): ChartPoint[] {
  const slice = metrics.slice(-days);
  return slice.map((d) => ({
    date: d.date,
    value:
      key === "engagement"
        ? d.engagementRate
        : key === "watchTime"
          ? d.watchTimeHours
          : key === "ctr"
            ? d.ctr
            : key === "subscribers"
              ? d.subscribersGained - d.subscribersLost
              : (d[key as "views" | "likes" | "comments"] as number),
  }));
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [range, setRange] = useState<Range>("28");
  const [studioTab, setStudioTab] = useState<StudioTab>("overview");
  const [loading, setLoading] = useState(true);

  const caps = session?.capabilities;
  const advanced = caps?.advancedCharts ?? false;

  useEffect(() => {
    if (!hasChannel) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/overview?days=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.youtubeConnected && j.overview) setOverview(j.overview);
        else setOverview(null);
      })
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [hasChannel, range]);

  const days = Number(range);
  const rangeOptions = useMemo(() => {
    const opts: { value: Range; label: string }[] = [
      { value: "7", label: "7 days" },
      { value: "28", label: "28 days" },
    ];
    if ((caps?.historyDays ?? 30) >= 90) opts.push({ value: "90", label: "90 days" });
    return opts;
  }, [caps?.historyDays]);

  if (ytLoading || (hasChannel && loading) || !caps) {
    return <Loading label="Loading analytics" />;
  }

  if (!hasChannel) return <YouTubeConnectPrompt variant="select-channel" />;

  if (!overview) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t load your channel data right now. Try reconnecting in
          Settings or contact support if this continues.
        </p>
      </div>
    );
  }

  const studio = overview.studio;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`${overview.channel.title} · ${formatCompact(overview.channel.subscriberCount)} subscribers`}
        action={
          <SegmentedControl options={rangeOptions} value={range} onChange={setRange} />
        }
      />

      {studio ? (
        <div className="space-y-5">
          <StudioTabBar value={studioTab} onChange={setStudioTab} />
          <StudioAnalyticsPanel studio={studio} tab={studioTab} />
        </div>
      ) : (
        <DataNotice
          title="Studio metrics unavailable"
          description="We couldn't load detailed analytics from YouTube for this period. Your charts below may still show daily trends — try refreshing or reconnecting your channel in Settings."
        />
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <CardHeader title="Views over time" subtitle={`Last ${days} days`} />
          <MetricChart
            data={toChart(overview.metrics, "views", days)}
            formatValue={(v) => v.toLocaleString()}
            color={CHART_COLOR}
          />
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <UpgradeTeaser
          enabled={advanced}
          title="Engagement trends"
          description="Unlock engagement, CTR, and watch-time charts with Premium."
        >
          <Card className="p-6">
            <CardHeader title="Engagement rate" subtitle={`Last ${days} days`} />
            <MetricChart
              data={toChart(overview.metrics, "engagement", days)}
              color={CHART_COLOR}
              formatValue={(v) => `${v.toFixed(2)}%`}
            />
          </Card>
        </UpgradeTeaser>

        <UpgradeTeaser
          enabled={advanced}
          title="Watch time trends"
          description="Unlock watch-time charts with Premium."
        >
          <Card className="p-6">
            <CardHeader title="Watch time (hrs)" subtitle={`Last ${days} days`} />
            <MetricChart
              data={toChart(overview.metrics, "watchTime", days)}
              color={CHART_COLOR}
              formatValue={(v) => `${formatCompact(v)} h`}
            />
          </Card>
        </UpgradeTeaser>
      </div>

      <UpgradeTeaser
        enabled={caps.anomalyDetection}
        title="Spike & anomaly detection"
        description="Premium flags unusual spikes and dips in your metrics."
        minHeight={160}
      >
        <AnomalyList anomalies={overview.anomalies} />
      </UpgradeTeaser>
    </div>
  );
}
