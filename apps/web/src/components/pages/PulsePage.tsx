"use client";

import type { MetricAnomaly, MetricTip, SubscriptionTier } from "@tubepath/core";
import { formatSpikeTeaser } from "@tubepath/core";
import {
  AiTipPanel,
  DailyPulseCard,
  HeroEngagement,
  InsightFeed,
  LockedGraphTeaser,
  MetricChart,
  StatCard,
  UpgradeCta,
} from "@tubepath/ui";
import { useCallback, useEffect, useState } from "react";
import { metricsToChart } from "@/lib/demo-data";

interface PulseData {
  headline: { text: string; sentiment: string };
  snapshot: {
    views: number;
    subscribers: number;
    likes: number;
    comments: number;
    engagementRate: number;
    periodChange: Record<string, number>;
  };
  dailyPulse: { headline: string };
  streak: number;
  lastSynced: string;
  metrics: Array<{ date: string; views: number; engagementRate: number; likes: number; comments: number; subscribersGained: number; subscribersLost: number }>;
  anomalies: MetricAnomaly[];
  insights: Array<{ id: string; type: string; summary: string; detail?: string; priority: string }>;
  tier: SubscriptionTier;
}

export function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tip, setTip] = useState<MetricTip | null>(null);
  const [tipOpen, setTipOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/pulse");
    const json = await res.json();
    setData(json);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/check-in", { method: "POST" }).catch(() => {});
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetch("/api/sync", { method: "POST" });
    await load();
  };

  const handleUpgrade = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else window.location.href = "/app/settings?tier=pro";
  };

  const handleAnomalyClick = async (anomaly: MetricAnomaly) => {
    const res = await fetch("/api/ai/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric: "engagement", anomaly }),
    });
    const json = await res.json();
    setTip(json.tip);
    setTipOpen(true);
  };

  const handleInsightClick = async (card: { summary: string }) => {
    setTip({
      summary: card.summary,
      causes: [],
      actions: ["Review your latest upload", "Check engagement trends"],
      priority: "high",
    });
    setTipOpen(true);
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isPro = data.tier === "pro";
  const viewsChart = metricsToChart(data.metrics, "views");
  const engagementChart = metricsToChart(data.metrics, "engagement");
  const latestSpike = data.anomalies.find((a) => a.direction === "spike");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <DailyPulseCard
        headline={data.dailyPulse.headline}
        streak={data.streak}
        lastSynced={data.lastSynced}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <p
        className={`text-lg font-medium ${
          data.headline.sentiment === "positive"
            ? "text-success"
            : data.headline.sentiment === "negative"
              ? "text-danger"
              : "text-foreground"
        }`}
      >
        {data.headline.text}
      </p>

      <HeroEngagement
        rate={data.snapshot.engagementRate}
        change={data.snapshot.periodChange.engagement ?? 0}
      />

      {isPro ? (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricChart
            data={viewsChart}
            title="Views"
            formatValue={(v) => v.toLocaleString()}
          />
          <MetricChart
            data={engagementChart}
            title="Engagement rate"
            color="hsl(142, 76%, 45%)"
            formatValue={(v) => `${v.toFixed(2)}%`}
            anomalies={data.anomalies}
            onAnomalyClick={handleAnomalyClick}
          />
        </div>
      ) : (
        <>
          <MetricChart
            data={viewsChart}
            title="Views — last 30 days"
            formatValue={(v) => v.toLocaleString()}
          />
          <LockedGraphTeaser
            title="Engagement over time"
            teaserText={
              latestSpike
                ? formatSpikeTeaser(latestSpike)
                : "Unlock engagement graphs and spike detection"
            }
            onUpgrade={handleUpgrade}
          />
        </>
      )}

      {isPro && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricChart
            data={metricsToChart(data.metrics, "likes")}
            title="Likes"
            className="col-span-2 md:col-span-1"
          />
          <MetricChart
            data={metricsToChart(data.metrics, "comments")}
            title="Comments"
            color="hsl(280, 70%, 60%)"
            className="col-span-2 md:col-span-1"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Subscribers"
          metricKey="subscribers"
          value={data.snapshot.subscribers}
          change={data.snapshot.periodChange.subscribers ?? 0}
          locked={!isPro}
        />
        <StatCard
          label="Comments"
          metricKey="comments"
          value={data.snapshot.comments}
          change={data.snapshot.periodChange.comments ?? 0}
          locked={!isPro}
        />
        <StatCard
          label="Likes"
          metricKey="likes"
          value={data.snapshot.likes}
          change={data.snapshot.periodChange.likes ?? 0}
          locked={!isPro}
        />
        <StatCard
          label="Views"
          metricKey="views"
          value={data.snapshot.views}
          change={data.snapshot.periodChange.views ?? 0}
        />
      </div>

      <InsightFeed
        cards={data.insights.slice(0, isPro ? undefined : 3) as Parameters<typeof InsightFeed>[0]["cards"]}
        onCardClick={handleInsightClick}
      />

      {!isPro && <UpgradeCta onUpgrade={handleUpgrade} />}

      <AiTipPanel tip={tip} open={tipOpen} onClose={() => setTipOpen(false)} />
    </div>
  );
}
