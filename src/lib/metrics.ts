import type {
  Anomaly,
  DailyMetric,
  DailyPulse,
  MetricKey,
  MetricSnapshot,
} from "./types";

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function mean(arr: number[]): number {
  return arr.length ? sum(arr) / arr.length : 0;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

/** Build a snapshot comparing the most recent window vs the prior window. */
export function computeSnapshot(
  metrics: DailyMetric[],
  windowDays = 28
): MetricSnapshot {
  const recent = metrics.slice(-windowDays);
  const prior = metrics.slice(-windowDays * 2, -windowDays);

  const agg = (m: DailyMetric[]) => ({
    views: sum(m.map((d) => d.views)),
    subscribers: sum(m.map((d) => d.subscribersGained - d.subscribersLost)),
    likes: sum(m.map((d) => d.likes)),
    comments: sum(m.map((d) => d.comments)),
    watchTimeHours: sum(m.map((d) => d.watchTimeHours)),
    ctr: mean(m.map((d) => d.ctr)),
    engagementRate: mean(m.map((d) => d.engagementRate)),
  });

  const r = agg(recent);
  const p = agg(prior.length ? prior : recent);

  const periodChange: Partial<Record<MetricKey, number>> = {
    views: pctChange(r.views, p.views),
    subscribers: pctChange(r.subscribers, p.subscribers),
    likes: pctChange(r.likes, p.likes),
    comments: pctChange(r.comments, p.comments),
    watchTime: pctChange(r.watchTimeHours, p.watchTimeHours),
    ctr: pctChange(r.ctr, p.ctr),
    engagement: pctChange(r.engagementRate, p.engagementRate),
  };

  return { ...r, periodChange };
}

const METRIC_FROM_DAILY: Record<
  "views" | "engagement" | "likes" | "comments",
  (d: DailyMetric) => number
> = {
  views: (d) => d.views,
  engagement: (d) => d.engagementRate,
  likes: (d) => d.likes,
  comments: (d) => d.comments,
};

/** z-score based spike / dip detection on a few key metrics. */
export function detectAnomalies(
  metrics: DailyMetric[],
  threshold = 2.1
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const keys = Object.keys(METRIC_FROM_DAILY) as Array<
    keyof typeof METRIC_FROM_DAILY
  >;

  for (const key of keys) {
    const series = metrics.map(METRIC_FROM_DAILY[key]);
    const m = mean(series);
    const sd = stddev(series);
    if (sd === 0) continue;

    metrics.forEach((day, i) => {
      const z = (series[i] - m) / sd;
      if (Math.abs(z) >= threshold) {
        anomalies.push({
          date: day.date,
          metric: key as MetricKey,
          value: series[i],
          zScore: Number(z.toFixed(2)),
          direction: z > 0 ? "spike" : "dip",
        });
      }
    });
  }

  return anomalies.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
}

export function computePulse(metrics: DailyMetric[], streak: number): DailyPulse {
  const today = metrics[metrics.length - 1];
  const yesterday = metrics[metrics.length - 2] ?? today;

  const viewsDelta = pctChange(today.views, yesterday.views);
  const engagementDelta = pctChange(
    today.engagementRate,
    yesterday.engagementRate
  );
  const subscribersDelta =
    today.subscribersGained - today.subscribersLost;

  const tone =
    viewsDelta > 8 ? "positive" : viewsDelta < -8 ? "negative" : "neutral";

  const headline =
    tone === "positive"
      ? `You're up ${viewsDelta.toFixed(0)}% in views today. Momentum is real.`
      : tone === "negative"
        ? `Views dipped ${Math.abs(viewsDelta).toFixed(0)}% today. Let's fix it.`
        : `Steady day. ${subscribersDelta >= 0 ? "+" : ""}${subscribersDelta} subscribers.`;

  return {
    headline,
    tone,
    viewsDelta,
    engagementDelta,
    subscribersDelta,
    streak,
    lastSynced: new Date().toISOString(),
  };
}
