import type {
  ChannelSummary,
  CompetitorChannel,
  DailyMetric,
  InsightCard,
  MetricAnomaly,
  MetricSnapshot,
  PipelineEdge,
  PipelineNode,
  SubscriptionTier,
  VideoSummary,
} from "@tubepath/core";
import {
  buildDailyMetric,
  buildDailyPulse,
  buildMetricSnapshot,
  buildPulseHeadline,
  detectAnomalies,
} from "@tubepath/core";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const DEMO_CHANNEL: ChannelSummary = {
  id: "demo-channel-1",
  youtubeChannelId: "UCdemo123",
  title: "Demo Creator Channel",
  thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  role: "owner",
  subscriberCount: 12500,
};

export const DEMO_CHANNELS: ChannelSummary[] = [DEMO_CHANNEL];

function generateDemoMetrics(days: number): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const baseViews = 800 + Math.sin(i * 0.3) * 200 + Math.random() * 150;
    const likes = Math.floor(baseViews * (0.04 + Math.random() * 0.02));
    const comments = Math.floor(baseViews * (0.008 + Math.random() * 0.005));
    metrics.push(
      buildDailyMetric({
        date: daysAgo(i),
        views: Math.floor(baseViews),
        likes,
        comments,
        subscribersGained: Math.floor(Math.random() * 30),
        subscribersLost: Math.floor(Math.random() * 5),
      })
    );
  }
  return metrics;
}

export function getDemoPulseData(tier: SubscriptionTier = "free") {
  const historyDays = tier === "pro" ? 90 : 30;
  const metrics = generateDemoMetrics(historyDays);
  const midpoint = Math.floor(metrics.length / 2);
  const current = metrics.slice(midpoint);
  const previous = metrics.slice(0, midpoint);
  const snapshot = buildMetricSnapshot(current, previous);
  const headline = buildPulseHeadline(snapshot);
  const yesterday = metrics[metrics.length - 2] ?? null;
  const today = metrics[metrics.length - 1] ?? null;
  const dailyPulse = buildDailyPulse(yesterday, today);
  const anomalies = detectAnomalies(metrics, "engagement");

  return {
    channel: DEMO_CHANNEL,
    metrics,
    snapshot,
    headline,
    dailyPulse,
    anomalies,
    streak: 5,
    lastSynced: "2m ago",
  };
}

export function getDemoVideos(): VideoSummary[] {
  return [
    {
      id: "demo-v1",
      youtubeVideoId: "dQw4w9WgXcQ",
      title: "How I Grew My Channel to 10K Subs",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      publishedAt: daysAgo(5),
      views: 12400,
      likes: 890,
      comments: 156,
      engagementRate: 8.44,
    },
    {
      id: "demo-v2",
      youtubeVideoId: "demo2",
      title: "My Full YouTube Setup Tour 2025",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      publishedAt: daysAgo(12),
      views: 8200,
      likes: 520,
      comments: 89,
      engagementRate: 7.43,
    },
    {
      id: "demo-v3",
      youtubeVideoId: "demo3",
      title: "5 Mistakes New Creators Make",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      publishedAt: daysAgo(20),
      views: 15600,
      likes: 1100,
      comments: 234,
      engagementRate: 8.55,
    },
  ];
}

export function getDemoInsights(): InsightCard[] {
  return [
    {
      id: "ins-1",
      type: "engagement",
      summary: "Your engagement rate jumped 18% — reply to comments within the first hour to keep momentum.",
      detail: "Videos where you replied to 10+ comments in hour 1 saw 2x engagement.",
      actions: ["Pin a question in comments", "Reply to top 5 comments now"],
      priority: "high",
    },
    {
      id: "ins-2",
      type: "views",
      summary: "Tuesday uploads are outperforming your average by 34%.",
      priority: "medium",
    },
    {
      id: "ins-3",
      type: "general",
      summary: "Add chapter timestamps — your 8+ min videos with chapters get more likes.",
      priority: "medium",
    },
  ];
}

export function getDemoCompetitors(): CompetitorChannel[] {
  return [
    {
      id: "comp-1",
      youtubeChannelId: "UCcompetitor1",
      nickname: "Rival Creator",
      title: "Rival Creator",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      subscriberCount: 45000,
    },
  ];
}

export function getDemoPipeline(): { nodes: PipelineNode[]; edges: PipelineEdge[] } {
  return {
    nodes: [
      {
        id: "pn-1",
        type: "competitor_video",
        title: "Competitor's viral hook breakdown",
        url: "https://youtube.com/watch?v=demo",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        createdAt: daysAgo(10),
      },
      {
        id: "pn-2",
        type: "note",
        title: "Use pattern interrupt in first 3 sec",
        notes: "Open with a bold claim, then deliver proof",
        createdAt: daysAgo(8),
      },
      {
        id: "pn-3",
        type: "published_video",
        title: "How I Grew My Channel to 10K Subs",
        videoId: "demo-v1",
        createdAt: daysAgo(5),
      },
    ],
    edges: [
      { id: "pe-1", sourceId: "pn-1", targetId: "pn-2", type: "inspired_by" },
      { id: "pe-2", sourceId: "pn-2", targetId: "pn-3", type: "referenced" },
    ],
  };
}

export type DemoSession = {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  activeChannelId: string;
};

export function getDemoSession(tier: SubscriptionTier = "free"): DemoSession {
  return {
    userId: "demo-user",
    email: "demo@tubepath.app",
    tier,
    activeChannelId: DEMO_CHANNEL.id,
  };
}

export function metricsToChart(
  metrics: DailyMetric[],
  key: "views" | "engagement" | "likes" | "comments" | "subscribers"
) {
  return metrics.map((m) => ({
    date: m.date,
    value:
      key === "views"
        ? m.views
        : key === "engagement"
          ? m.engagementRate
          : key === "likes"
            ? m.likes
            : key === "comments"
              ? m.comments
              : m.subscribersGained - m.subscribersLost,
  }));
}

export function getDemoAnomalies(): MetricAnomaly[] {
  const metrics = generateDemoMetrics(30);
  return detectAnomalies(metrics, "engagement");
}

export function getDemoSnapshot(): MetricSnapshot {
  const metrics = generateDemoMetrics(30);
  const snapshot = buildMetricSnapshot(metrics.slice(15), metrics.slice(0, 15));
  return snapshot;
}
