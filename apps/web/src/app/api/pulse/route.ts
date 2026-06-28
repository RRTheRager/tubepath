import { NextResponse } from "next/server";
import { buildPulseHeadline, buildMetricSnapshot, buildDailyPulse } from "@tubepath/core";
import {
  getDemoInsights,
  getDemoPulseData,
} from "@/lib/demo-data";
import { getSession, getStreak } from "@/lib/session";
import { isDemoMode } from "@/lib/env";
import { getTierLimits } from "@/lib/tier";

export async function GET() {
  const session = await getSession();
  const tier = session?.tier ?? "free";
  const limits = getTierLimits(tier);

  if (isDemoMode() || !session) {
    const data = getDemoPulseData(tier);
    return NextResponse.json({
      ...data,
      insights: getDemoInsights(),
      tier,
    });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  if (!supabase || !session.activeChannelId) {
    const data = getDemoPulseData(tier);
    return NextResponse.json({ ...data, insights: getDemoInsights(), tier });
  }

  const since = new Date();
  since.setDate(since.getDate() - limits.historyDays);

  const { data: rows } = await supabase
    .from("channel_metrics_daily")
    .select("*")
    .eq("channel_connection_id", session.activeChannelId)
    .gte("date", since.toISOString().slice(0, 10))
    .order("date");

  const metrics = (rows ?? []).map((r) => ({
    date: r.date,
    views: Number(r.views),
    subscribersGained: r.subscribers_gained,
    subscribersLost: r.subscribers_lost,
    likes: Number(r.likes),
    comments: Number(r.comments),
    engagementRate: Number(r.engagement_rate),
  }));

  const midpoint = Math.floor(metrics.length / 2);
  const snapshot = buildMetricSnapshot(
    metrics.slice(midpoint),
    metrics.slice(0, midpoint)
  );
  const headline = buildPulseHeadline(snapshot);
  const dailyPulse = buildDailyPulse(
    metrics[metrics.length - 2] ?? null,
    metrics[metrics.length - 1] ?? null
  );
  const streak = await getStreak(session.userId);

  const { data: anomalies } = await supabase
    .from("metric_anomalies")
    .select("*")
    .eq("channel_connection_id", session.activeChannelId)
    .order("date", { ascending: false })
    .limit(10);

  return NextResponse.json({
    channel: session.channels.find((c) => c.id === session.activeChannelId),
    metrics,
    snapshot,
    headline,
    dailyPulse,
    streak,
    lastSynced: "recently",
    anomalies: (anomalies ?? []).map((a) => ({
      date: a.date,
      metric: a.metric,
      value: Number(a.value),
      zScore: Number(a.z_score),
      direction: a.direction,
    })),
    insights: getDemoInsights(),
    tier,
  });
}
