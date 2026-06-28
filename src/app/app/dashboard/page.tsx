"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { DailyMetric, MetricKey, OverviewPayload } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Delta } from "@/components/ui/Delta";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { MetricChart, type ChartPoint } from "@/components/charts/MetricChart";
import { UpgradeTeaser } from "@/components/access/UpgradeTeaser";
import { Loading } from "@/components/ui/Loading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AnomalyList } from "@/components/dashboard/AnomalyList";
import { formatCompact } from "@/lib/utils";

type Range = "7" | "30" | "90";

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
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [range, setRange] = useState<Range>("30");

  const caps = session?.capabilities;
  const advanced = caps?.advancedCharts ?? false;

  useEffect(() => {
    fetch("/api/overview", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setOverview(j.overview))
      .catch(() => {});
  }, []);

  const days = Number(range);
  const maxDays = caps?.historyDays ?? 30;

  const rangeOptions = useMemo(() => {
    const opts: { value: Range; label: string }[] = [
      { value: "7", label: "7d" },
      { value: "30", label: "30d" },
    ];
    if (maxDays >= 90) opts.push({ value: "90", label: "90d" });
    return opts;
  }, [maxDays]);

  if (!overview || !caps) return <Loading label="Crunching your numbers" />;

  const s = overview.snapshot;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {overview.channel.title} &middot;{" "}
            {formatCompact(overview.channel.subscriberCount)} subscribers
          </p>
        </div>
        <SegmentedControl
          options={rangeOptions}
          value={range}
          onChange={setRange}
        />
      </div>

      {/* Engagement hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mac-card relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" /> Engagement rate
        </div>
        <div className="mt-2 flex items-end gap-3">
          <AnimatedNumber
            value={s.engagementRate}
            format={(n) => `${n.toFixed(1)}%`}
            className="text-5xl font-bold tracking-tight"
          />
          <div className="mb-2">
            <Delta value={s.periodChange.engagement ?? 0} />
          </div>
        </div>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Likes + comments per view. The single best signal of how far your next
          upload will travel.
        </p>
      </motion.div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Views (28d)" value={s.views} change={s.periodChange.views} format={formatCompact} />
        <StatCard label="Subscribers" value={s.subscribers} change={s.periodChange.subscribers} format={formatCompact} />
        <StatCard label="Likes" value={s.likes} change={s.periodChange.likes} format={formatCompact} />
        <StatCard label="Comments" value={s.comments} change={s.periodChange.comments} format={formatCompact} />
        <StatCard
          label="Watch time (hrs)"
          value={s.watchTimeHours}
          change={s.periodChange.watchTime}
          format={formatCompact}
          locked={!advanced}
        />
        <StatCard
          label="CTR"
          value={s.ctr}
          change={s.periodChange.ctr}
          format={(n) => `${n.toFixed(1)}%`}
          locked={!advanced}
        />
      </div>

      {/* Views chart - always available */}
      <Card>
        <CardHeader title="Views" subtitle={`Last ${days} days`} />
        <MetricChart
          data={toChart(overview.metrics, "views", days)}
          formatValue={(v) => v.toLocaleString()}
        />
      </Card>

      {/* Advanced charts - premium */}
      <div className="grid gap-4 md:grid-cols-2">
        <UpgradeTeaser
          enabled={advanced}
          title="Engagement trends"
          description="See engagement, CTR, and watch time over time with Premium."
        >
          <Card>
            <CardHeader title="Engagement rate" subtitle={`Last ${days} days`} />
            <MetricChart
              data={toChart(overview.metrics, "engagement", days)}
              color="hsl(142 70% 45%)"
              formatValue={(v) => `${v.toFixed(2)}%`}
            />
          </Card>
        </UpgradeTeaser>

        <UpgradeTeaser
          enabled={advanced}
          title="Watch time"
          description="Unlock watch-time analytics with Premium."
        >
          <Card>
            <CardHeader title="Watch time (hrs)" subtitle={`Last ${days} days`} />
            <MetricChart
              data={toChart(overview.metrics, "watchTime", days)}
              color="hsl(280 70% 60%)"
              formatValue={(v) => `${formatCompact(v)} h`}
            />
          </Card>
        </UpgradeTeaser>
      </div>

      {/* Anomalies - premium */}
      <UpgradeTeaser
        enabled={caps.anomalyDetection}
        title="Spike & anomaly detection"
        description="Premium flags unusual spikes and dips and explains what drove them."
        minHeight={160}
      >
        <AnomalyList anomalies={overview.anomalies} />
      </UpgradeTeaser>
    </div>
  );
}
