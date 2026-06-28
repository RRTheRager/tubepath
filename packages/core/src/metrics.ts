import type { DailyMetric, MetricKey, MetricSnapshot, PulseHeadline } from "./types";

export function computeEngagementRate(
  likes: number,
  comments: number,
  views: number
): number {
  if (views <= 0) return 0;
  return ((likes + comments) / views) * 100;
}

export function buildDailyMetric(input: {
  date: string;
  views: number;
  subscribersGained?: number;
  subscribersLost?: number;
  likes: number;
  comments: number;
}): DailyMetric {
  const engagementRate = computeEngagementRate(
    input.likes,
    input.comments,
    input.views
  );
  return {
    date: input.date,
    views: input.views,
    subscribersGained: input.subscribersGained ?? 0,
    subscribersLost: input.subscribersLost ?? 0,
    likes: input.likes,
    comments: input.comments,
    engagementRate,
  };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function sumMetrics(metrics: DailyMetric[]): DailyMetric | null {
  if (metrics.length === 0) return null;
  const totals = metrics.reduce(
    (acc, m) => ({
      views: acc.views + m.views,
      subscribersGained: acc.subscribersGained + m.subscribersGained,
      subscribersLost: acc.subscribersLost + m.subscribersLost,
      likes: acc.likes + m.likes,
      comments: acc.comments + m.comments,
    }),
    { views: 0, subscribersGained: 0, subscribersLost: 0, likes: 0, comments: 0 }
  );
  return buildDailyMetric({
    date: metrics[metrics.length - 1]!.date,
    ...totals,
  });
}

export function buildMetricSnapshot(
  current: DailyMetric[],
  previous: DailyMetric[]
): MetricSnapshot {
  const currentTotals = sumMetrics(current);
  const previousTotals = sumMetrics(previous);

  const views = currentTotals?.views ?? 0;
  const likes = currentTotals?.likes ?? 0;
  const comments = currentTotals?.comments ?? 0;
  const subscribers =
    (currentTotals?.subscribersGained ?? 0) -
    (currentTotals?.subscribersLost ?? 0);
  const engagementRate = computeEngagementRate(likes, comments, views);

  const prevViews = previousTotals?.views ?? 0;
  const prevLikes = previousTotals?.likes ?? 0;
  const prevComments = previousTotals?.comments ?? 0;
  const prevSubs =
    (previousTotals?.subscribersGained ?? 0) -
    (previousTotals?.subscribersLost ?? 0);
  const prevEngagement = computeEngagementRate(
    prevLikes,
    prevComments,
    prevViews
  );

  return {
    views,
    subscribers,
    likes,
    comments,
    engagementRate,
    periodChange: {
      views: percentChange(views, prevViews),
      subscribers: percentChange(subscribers, prevSubs),
      likes: percentChange(likes, prevLikes),
      comments: percentChange(comments, prevComments),
      engagement: percentChange(engagementRate, prevEngagement),
    },
  };
}

export function buildPulseHeadline(
  snapshot: MetricSnapshot
): PulseHeadline {
  const engChange = snapshot.periodChange.engagement ?? 0;
  const viewsChange = snapshot.periodChange.views ?? 0;

  if (engChange >= 10) {
    return {
      text: `Engagement is up ${engChange.toFixed(1)}% — your best run recently.`,
      sentiment: "positive",
    };
  }
  if (engChange <= -10) {
    return {
      text: `Engagement dipped ${Math.abs(engChange).toFixed(1)}% — worth a closer look.`,
      sentiment: "negative",
    };
  }
  if (viewsChange >= 15) {
    return {
      text: `Views surged ${viewsChange.toFixed(1)}% while engagement holds steady.`,
      sentiment: "positive",
    };
  }
  return {
    text: "Your channel is holding steady — small tweaks could unlock more engagement.",
    sentiment: "neutral",
  };
}

export function buildDailyPulse(
  yesterday: DailyMetric | null,
  today: DailyMetric | null
): {
  viewsDelta: number;
  engagementDelta: number;
  subscribersDelta: number;
  likesDelta: number;
  commentsDelta: number;
  headline: string;
} {
  if (!yesterday || !today) {
    return {
      viewsDelta: 0,
      engagementDelta: 0,
      subscribersDelta: 0,
      likesDelta: 0,
      commentsDelta: 0,
      headline: "Sync your channel to see what changed since yesterday.",
    };
  }

  const viewsDelta = today.views - yesterday.views;
  const engagementDelta = today.engagementRate - yesterday.engagementRate;
  const subscribersDelta =
    today.subscribersGained -
    today.subscribersLost -
    (yesterday.subscribersGained - yesterday.subscribersLost);
  const likesDelta = today.likes - yesterday.likes;
  const commentsDelta = today.comments - yesterday.comments;

  const parts: string[] = [];
  if (viewsDelta !== 0) parts.push(`${viewsDelta >= 0 ? "+" : ""}${viewsDelta} views`);
  if (engagementDelta !== 0)
    parts.push(
      `engagement ${engagementDelta >= 0 ? "+" : ""}${engagementDelta.toFixed(1)}%`
    );

  return {
    viewsDelta,
    engagementDelta,
    subscribersDelta,
    likesDelta,
    commentsDelta,
    headline:
      parts.length > 0
        ? `Since yesterday: ${parts.join(", ")}`
        : "No major changes since yesterday.",
  };
}

export function formatMetricValue(key: MetricKey, value: number): string {
  switch (key) {
    case "engagement":
      return `${value.toFixed(2)}%`;
    case "views":
    case "subscribers":
    case "likes":
    case "comments":
      return value.toLocaleString();
    default:
      return String(value);
  }
}

export function trendDirection(
  change: number
): "up" | "down" | "flat" {
  if (change > 1) return "up";
  if (change < -1) return "down";
  return "flat";
}
