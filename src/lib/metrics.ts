import type {
  Anomaly,
  DailyMetric,
  DailyPulse,
  MetricKey,
  MetricSnapshot,
} from "./types";

export const SHORTS_MAX_SECONDS = 60;

export interface EngagementBucket {
  views: number;
  likes: number;
  comments: number;
}

export interface EngagementSplit {
  long: EngagementBucket;
  shorts: EngagementBucket;
}

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

export function computeEngagementRate(
  likes: number,
  comments: number,
  views: number
): number {
  if (views <= 0) return 0;
  return Number((((likes + comments) / views) * 100).toFixed(2));
}

function aggWindow(m: DailyMetric[]) {
  const views = sum(m.map((d) => d.views));
  const likes = sum(m.map((d) => d.likes));
  const comments = sum(m.map((d) => d.comments));
  const impressions = sum(m.map((d) => d.impressions));
  const ctrWeighted =
    impressions > 0
      ? sum(m.map((d) => d.ctr * d.impressions)) / impressions
      : mean(m.map((d) => d.ctr));

  return {
    views,
    subscribers: sum(m.map((d) => d.subscribersGained - d.subscribersLost)),
    likes,
    comments,
    watchTimeHours: sum(m.map((d) => d.watchTimeHours)),
    ctr: Number(ctrWeighted.toFixed(2)),
    engagementRate: computeEngagementRate(likes, comments, views),
  };
}

function bucketRate(bucket: EngagementBucket): number {
  return computeEngagementRate(bucket.likes, bucket.comments, bucket.views);
}

/** Build a snapshot comparing the most recent window vs the prior window. */
export function computeSnapshot(
  metrics: DailyMetric[],
  windowDays = 28,
  split?: EngagementSplit,
  priorSplit?: EngagementSplit
): MetricSnapshot {
  const recent = metrics.slice(-windowDays);
  const prior = metrics.slice(-windowDays * 2, -windowDays);

  const r = aggWindow(recent);
  const p = aggWindow(prior.length ? prior : recent);

  const engagementRateLong = split
    ? bucketRate(split.long)
    : r.engagementRate;
  const engagementRateShorts = split
    ? bucketRate(split.shorts)
    : 0;

  const prevLong = priorSplit
    ? bucketRate(priorSplit.long)
    : p.engagementRate;
  const prevShorts = priorSplit ? bucketRate(priorSplit.shorts) : 0;

  const periodChange: Partial<Record<MetricKey, number>> = {
    views: pctChange(r.views, p.views),
    subscribers: pctChange(r.subscribers, p.subscribers),
    likes: pctChange(r.likes, p.likes),
    comments: pctChange(r.comments, p.comments),
    watchTime: pctChange(r.watchTimeHours, p.watchTimeHours),
    ctr: pctChange(r.ctr, p.ctr),
    engagement: pctChange(r.engagementRate, p.engagementRate),
  };

  return {
    ...r,
    engagementRateLong,
    engagementRateShorts,
    engagementLongChange: split
      ? pctChange(engagementRateLong, prevLong)
      : undefined,
    engagementShortsChange:
      split && priorSplit
        ? pctChange(engagementRateShorts, prevShorts)
        : undefined,
    periodChange,
  };
}

/** z-score based spike / dip detection on a few key metrics. */
export function detectAnomalies(
  metrics: DailyMetric[],
  opts?: { windowDays?: number; threshold?: number; maxResults?: number }
): Anomaly[] {
  const windowDays = opts?.windowDays ?? metrics.length;
  const threshold = opts?.threshold ?? 2.5;
  const maxResults = opts?.maxResults ?? 5;
  const window = metrics.slice(-windowDays);

  if (window.length < 14) return [];

  const anomalies: Anomaly[] = [];

  const detectSeries = (
    key: MetricKey,
    series: number[],
    dates: string[]
  ) => {
    const m = mean(series);
    const sd = stddev(series);
    if (sd === 0) return;

    series.forEach((val, i) => {
      const z = (val - m) / sd;
      if (Math.abs(z) >= threshold) {
        anomalies.push({
          date: dates[i],
          metric: key,
          value: val,
          zScore: Number(z.toFixed(2)),
          direction: z > 0 ? "spike" : "dip",
        });
      }
    });
  };

  const dates = window.map((d) => d.date);
  detectSeries(
    "views",
    window.map((d) => d.views),
    dates
  );

  const pooledRates = window.map((d) =>
    computeEngagementRate(d.likes, d.comments, d.views)
  );
  detectSeries("engagement", pooledRates, dates);

  return anomalies
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, maxResults);
}

export function computePulse(metrics: DailyMetric[], streak: number): DailyPulse {
  const today = metrics[metrics.length - 1];
  const yesterday = metrics[metrics.length - 2] ?? today;

  const viewsDelta = pctChange(today.views, yesterday.views);
  const engagementDelta = today.engagementRate - yesterday.engagementRate;
  const subscribersDelta =
    today.subscribersGained - today.subscribersLost;

  const tone =
    viewsDelta > 8 ? "positive" : viewsDelta < -8 ? "negative" : "neutral";

  const headline =
    tone === "positive"
      ? `Views up ${viewsDelta.toFixed(0)}% vs yesterday.`
      : tone === "negative"
        ? `Views down ${Math.abs(viewsDelta).toFixed(0)}% vs yesterday.`
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
