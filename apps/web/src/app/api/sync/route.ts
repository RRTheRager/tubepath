import { NextResponse } from "next/server";
import { getDemoPulseData } from "@/lib/demo-data";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/env";
import { aggregateMetricsForStorage, runSpikeDetection, syncChannelMetrics } from "@/lib/sync";
import { getTierLimits } from "@/lib/tier";

export async function POST() {
  const session = await getSession();
  const tier = session?.tier ?? "free";
  const limits = getTierLimits(tier);

  if (isDemoMode() || !session?.activeChannelId) {
    const data = getDemoPulseData(tier);
    return NextResponse.json({
      ok: true,
      metrics: data.metrics.length,
      demo: true,
    });
  }

  const channel = session.channels.find((c) => c.id === session.activeChannelId);
  if (!channel) {
    return NextResponse.json({ error: "No channel" }, { status: 400 });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  const { data: googleAccount } = await supabase
    .from("google_accounts")
    .select("access_token")
    .eq("user_id", session.userId)
    .single();

  if (!googleAccount?.access_token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const metrics = await syncChannelMetrics(
    googleAccount.access_token,
    channel.youtubeChannelId,
    limits.historyDays
  );

  const storageRows = aggregateMetricsForStorage(metrics);
  for (const row of storageRows) {
    await supabase.from("channel_metrics_daily").upsert(
      {
        channel_connection_id: session.activeChannelId,
        ...row,
      },
      { onConflict: "channel_connection_id,date" }
    );
  }

  const anomalies = runSpikeDetection(metrics);
  for (const a of anomalies) {
    await supabase.from("metric_anomalies").upsert(
      {
        channel_connection_id: session.activeChannelId,
        date: a.date,
        metric: a.metric,
        value: a.value,
        z_score: a.zScore,
        direction: a.direction,
      },
      { onConflict: "channel_connection_id,date,metric" }
    );
  }

  await supabase
    .from("channel_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", session.activeChannelId);

  return NextResponse.json({ ok: true, metrics: metrics.length, anomalies: anomalies.length });
}
