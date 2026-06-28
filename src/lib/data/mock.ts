import type {
  Anomaly,
  ChannelSummary,
  DailyMetric,
  InsightCard,
  MetricSnapshot,
  OverviewPayload,
  VideoDetail,
  VideoSummary,
} from "@/lib/types";
import {
  computePulse,
  computeSnapshot,
  detectAnomalies,
} from "@/lib/metrics";
import { seededRandom } from "@/lib/utils";
import type { DataProvider, OverviewOptions } from "./provider";

const SEED = 73;

const VIDEO_TITLES = [
  "I Tried the Viral 30-Day Productivity System",
  "Why Your First 10 Seconds Decide Everything",
  "The Editing Trick Nobody Talks About",
  "I Reverse-Engineered MrBeast's Thumbnails",
  "How I Got 1M Views With a $0 Budget",
  "Stop Making These 5 Beginner Mistakes",
  "The Algorithm Update That Changes Everything",
  "I Posted Every Day for 100 Days",
  "Reading Your Worst Comments (Brutal)",
  "The Hook Formula That Doubled My Retention",
  "Filming an Entire Video on My Phone",
  "What 50 Million Views Actually Taught Me",
  "The Underrated Tool Every Creator Needs",
  "I Copied a Trend (Here's What Happened)",
  "Behind the Scenes of My Biggest Video",
  "How to Never Run Out of Ideas Again",
  "My Honest Camera Gear Tier List",
  "The Title Mistake Costing You Views",
  "I Studied 1,000 Viral Shorts",
  "Turning a Flop Into a Hit (Case Study)",
  "The Retention Graph That Broke My Brain",
  "Scripting a Video in Under 20 Minutes",
  "Why Consistency Beats Quality (Sometimes)",
  "The Comment Strategy That 10x'd Engagement",
];

const TAG_POOL = [
  "youtube growth",
  "content creation",
  "video editing",
  "youtube algorithm",
  "thumbnails",
  "retention",
  "creator economy",
  "shorts",
  "storytelling",
  "productivity",
  "filmmaking",
  "seo",
];

function thumb(seed: number): string {
  return `https://picsum.photos/seed/tubepath-${seed}/640/360`;
}

function generateMetrics(days: number): DailyMetric[] {
  const rand = seededRandom(SEED);
  const out: DailyMetric[] = [];
  const start = new Date();
  start.setDate(start.getDate() - days + 1);

  let baseViews = 18_000;
  const growth = 1.0009; // gentle long-term growth

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    baseViews *= growth;

    const dow = date.getDay();
    const weekendBoost = dow === 0 || dow === 6 ? 1.18 : 1;
    const noise = 0.8 + rand() * 0.4;
    // Occasional viral spike
    const spike = rand() > 0.965 ? 2.4 + rand() * 2 : 1;

    const views = Math.round(baseViews * weekendBoost * noise * spike);
    const ctr = 4.2 + rand() * 4 + (spike > 1 ? 2 : 0);
    const engagementRate = 3.6 + rand() * 3.4 + (spike > 1 ? 1.5 : 0);
    const likes = Math.round(views * (engagementRate / 100) * 0.82);
    const comments = Math.round(views * (engagementRate / 100) * 0.18);
    const watchTimeHours = Math.round((views * (3.2 + rand() * 1.6)) / 60);
    const subscribersGained = Math.round(views * (0.004 + rand() * 0.006));
    const subscribersLost = Math.round(subscribersGained * (0.1 + rand() * 0.2));
    const impressions = Math.round(views / (ctr / 100));

    out.push({
      date: date.toISOString().slice(0, 10),
      views,
      subscribersGained,
      subscribersLost,
      likes,
      comments,
      watchTimeHours,
      impressions,
      ctr: Number(ctr.toFixed(2)),
      engagementRate: Number(engagementRate.toFixed(2)),
    });
  }

  return out;
}

function generateVideos(): VideoDetail[] {
  const rand = seededRandom(SEED + 5);
  const now = Date.now();

  return VIDEO_TITLES.map((title, idx) => {
    const ageDays = Math.round(2 + idx * 6 + rand() * 4);
    const publishedAt = new Date(now - ageDays * 86_400_000).toISOString();
    const viral = rand() > 0.8;
    const views = Math.round((40_000 + rand() * 380_000) * (viral ? 3 : 1));
    const ctr = Number((4 + rand() * 6).toFixed(2));
    const engagementRate = Number((3 + rand() * 5).toFixed(2));
    const likes = Math.round(views * (engagementRate / 100) * 0.82);
    const comments = Math.round(views * (engagementRate / 100) * 0.18);
    const durationSeconds = Math.round(360 + rand() * 900);
    const avgViewDurationSeconds = Math.round(
      durationSeconds * (0.32 + rand() * 0.4)
    );
    const retentionPct = Number(
      ((avgViewDurationSeconds / durationSeconds) * 100).toFixed(1)
    );
    const watchTimeHours = Math.round((views * avgViewDurationSeconds) / 3600);

    const dailyViews = Array.from({ length: 30 }, (_, d) => {
      const decay = Math.exp(-d / 10);
      return {
        date: new Date(now - (29 - d) * 86_400_000).toISOString().slice(0, 10),
        views: Math.round((views / 12) * decay * (0.6 + rand() * 0.8)),
      };
    });

    const retentionCurve = Array.from({ length: 11 }, (_, p) => ({
      pct: p * 10,
      audience: Math.round(100 * Math.exp(-p / (4 + rand() * 3))),
    }));

    const trafficSources = [
      { source: "Browse features", pct: 34 + Math.round(rand() * 10) },
      { source: "Suggested videos", pct: 26 + Math.round(rand() * 8) },
      { source: "Search", pct: 14 + Math.round(rand() * 6) },
      { source: "External", pct: 8 + Math.round(rand() * 4) },
      { source: "Other", pct: 6 + Math.round(rand() * 4) },
    ];

    const tags = TAG_POOL.filter(() => rand() > 0.55).slice(0, 6);

    return {
      id: `vid_${idx + 1}`,
      title,
      thumbnailUrl: thumb(idx + 1),
      publishedAt,
      durationSeconds,
      views,
      likes,
      comments,
      watchTimeHours,
      avgViewDurationSeconds,
      ctr,
      engagementRate,
      retentionPct,
      description:
        "In this video I break down exactly what worked, what didn't, and the systems you can steal. Timestamps and resources below.",
      tags: tags.length ? tags : TAG_POOL.slice(0, 4),
      dailyViews,
      retentionCurve,
      trafficSources,
    } satisfies VideoDetail;
  });
}

export function cannedInsights(
  snapshot: MetricSnapshot,
  anomalies: Anomaly[]
): InsightCard[] {
  const eng = snapshot.periodChange.engagement ?? 0;
  const views = snapshot.periodChange.views ?? 0;
  const spike = anomalies.find((a) => a.direction === "spike");

  const cards: InsightCard[] = [
    {
      id: "canned-1",
      tone: eng >= 0 ? "positive" : "negative",
      emoji: eng >= 0 ? "🔥" : "📉",
      headline:
        eng >= 0
          ? `Engagement is up ${eng.toFixed(0)}% this period`
          : `Engagement slipped ${Math.abs(eng).toFixed(0)}%`,
      detail:
        "Engagement (likes + comments per view) is the single best predictor of how far the algorithm pushes your next upload.",
      metric: "engagement",
      deltaLabel: `${eng >= 0 ? "+" : ""}${eng.toFixed(0)}%`,
      ai: false,
    },
    {
      id: "canned-2",
      tone: views >= 0 ? "positive" : "neutral",
      emoji: "👀",
      headline: `Views ${views >= 0 ? "climbed" : "moved"} ${Math.abs(views).toFixed(0)}%`,
      detail:
        "Your weekend uploads consistently outperform weekday ones. Lean into that posting window.",
      metric: "views",
      deltaLabel: `${views >= 0 ? "+" : ""}${views.toFixed(0)}%`,
      ai: false,
    },
    {
      id: "canned-3",
      tone: "tip",
      emoji: "💡",
      headline: "Ask a question in your first 10 seconds",
      detail:
        "Early questions reliably lift comment rate, which compounds into more reach. Pin your own answer to seed the thread.",
      ai: false,
    },
  ];

  if (spike) {
    cards.unshift({
      id: "canned-spike",
      tone: "positive",
      emoji: "🚀",
      headline: `A ${spike.metric} spike hit on ${spike.date}`,
      detail:
        "Something resonated hard that day. Unlock AI insights to see exactly which video drove it and how to repeat it.",
      metric: spike.metric,
      deltaLabel: `${spike.zScore}σ`,
      ai: false,
    });
  }

  return cards;
}

// Persist the generated videos across requests so chatbot edits stick in demo.
const g = globalThis as unknown as { __tubepathVideos?: VideoDetail[] };
function videoStore(): VideoDetail[] {
  return g.__tubepathVideos ?? (g.__tubepathVideos = generateVideos());
}

function toSummary(v: VideoDetail): VideoSummary {
  return {
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    durationSeconds: v.durationSeconds,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    watchTimeHours: v.watchTimeHours,
    avgViewDurationSeconds: v.avgViewDurationSeconds,
    ctr: v.ctr,
    engagementRate: v.engagementRate,
    retentionPct: v.retentionPct,
  };
}

export class MockProvider implements DataProvider {
  private videos = videoStore();

  async getOverview(opts: OverviewOptions): Promise<OverviewPayload> {
    const days = Math.min(Math.max(opts.historyDays, 7), 730);
    const metrics = generateMetrics(days);
    const snapshot = computeSnapshot(metrics);
    const anomalies = detectAnomalies(metrics);

    // Attach plausible video titles to anomalies for richer UX.
    for (const a of anomalies) {
      if (a.direction === "spike") {
        const v = this.videos[Math.floor(Math.random() * this.videos.length)];
        a.videoId = v.id;
        a.videoTitle = v.title;
      }
    }

    const channel: ChannelSummary = {
      id: "chan_demo",
      title: "Creator Lab",
      handle: "@creatorlab",
      thumbnailUrl: "https://picsum.photos/seed/tubepath-avatar/160/160",
      subscriberCount: 184_300,
      totalViews: metrics.reduce((a, d) => a + d.views, 0) + 22_000_000,
      videoCount: this.videos.length,
    };

    const pulse = computePulse(metrics, 4);
    const insights = cannedInsights(snapshot, anomalies);

    return { channel, snapshot, metrics, anomalies, pulse, insights };
  }

  async getVideos(): Promise<VideoSummary[]> {
    return this.videos
      .map(toSummary)
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  }

  async getVideo(id: string): Promise<VideoDetail | null> {
    return this.videos.find((v) => v.id === id) ?? null;
  }

  async updateVideo(
    id: string,
    patch: { title?: string; description?: string; tags?: string[] }
  ): Promise<VideoSummary | null> {
    const v = this.videos.find((x) => x.id === id);
    if (!v) return null;
    if (patch.title !== undefined) v.title = patch.title;
    if (patch.description !== undefined) v.description = patch.description;
    if (patch.tags !== undefined) v.tags = patch.tags;
    return toSummary(v);
  }
}
