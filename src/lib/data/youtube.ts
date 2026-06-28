import type {
  Account,
  ChannelSummary,
  DailyMetric,
  GoogleCredentials,
  OverviewPayload,
  VideoDetail,
  VideoSummary,
} from "@/lib/types";
import {
  computePulse,
  computeSnapshot,
  detectAnomalies,
} from "@/lib/metrics";
import type { DataProvider, OverviewOptions } from "./provider";
import { MockProvider, cannedInsights } from "./mock";
import {
  analyticsReport,
  dataApi,
  dataApiPut,
  getAccessToken,
  isoDaysAgo,
  isoToday,
  type AnalyticsReport,
} from "./youtube-client";
import {
  analyticsIds,
  findChannelLink,
  requireChannelId,
} from "@/lib/youtube/channels";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  return num(m?.[1]) * 3600 + num(m?.[2]) * 60 + num(m?.[3]);
}

function colIndex(report: AnalyticsReport, name: string): number {
  return report.columnHeaders.findIndex((c) => c.name === name);
}

interface ChannelListResponse {
  items?: {
    id: string;
    snippet?: { title?: string; customUrl?: string; thumbnails?: { default?: { url?: string } } };
    statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
  }[];
}

interface SearchResponse {
  items?: { id?: { videoId?: string } }[];
}

interface VideoListResponse {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      tags?: string[];
      categoryId?: string;
      thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
    };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
    contentDetails?: { duration?: string };
  }[];
}

/**
 * Real YouTube Data + Analytics provider. Each method attempts live API calls
 * and falls back to mock data on any failure so the app never breaks.
 */
export class YouTubeProvider implements DataProvider {
  private fallback = new MockProvider();

  constructor(
    private account: Account,
    private creds: GoogleCredentials
  ) {}

  private token() {
    return getAccessToken(this.creds);
  }

  private channelId(): string {
    return requireChannelId(this.account);
  }

  private analyticsIds(): string {
    return analyticsIds(this.channelId());
  }

  async getOverview(opts: OverviewOptions): Promise<OverviewPayload> {
    try {
      const token = await this.token();
      const channelId = this.channelId();
      const ids = this.analyticsIds();
      const days = Math.min(Math.max(opts.historyDays, 7), 730);
      const startDate = isoDaysAgo(days);
      const endDate = isoToday();

      const report = await analyticsReport(token, {
        ids,
        startDate,
        endDate,
        metrics:
          "views,likes,comments,estimatedMinutesWatched,subscribersGained,subscribersLost",
        dimensions: "day",
        sort: "day",
      });

      const di = colIndex(report, "day");
      const vi = colIndex(report, "views");
      const li = colIndex(report, "likes");
      const ci = colIndex(report, "comments");
      const wi = colIndex(report, "estimatedMinutesWatched");
      const sgi = colIndex(report, "subscribersGained");
      const sli = colIndex(report, "subscribersLost");

      // Best-effort impressions / CTR (not always available).
      const ctrByDate = new Map<string, { ctr: number; impressions: number }>();
      try {
        const imp = await analyticsReport(token, {
          ids,
          startDate,
          endDate,
          metrics: "impressions,impressionsClickThroughRate",
          dimensions: "day",
          sort: "day",
        });
        const idi = colIndex(imp, "day");
        const ii = colIndex(imp, "impressions");
        const cti = colIndex(imp, "impressionsClickThroughRate");
        for (const row of imp.rows ?? []) {
          ctrByDate.set(String(row[idi]), {
            impressions: num(row[ii]),
            ctr: num(row[cti]),
          });
        }
      } catch {
        /* impressions are optional */
      }

      const metrics: DailyMetric[] = (report.rows ?? []).map((row) => {
        const views = num(row[vi]);
        const likes = num(row[li]);
        const comments = num(row[ci]);
        const date = String(row[di]);
        const extra = ctrByDate.get(date);
        return {
          date,
          views,
          likes,
          comments,
          watchTimeHours: Math.round(num(row[wi]) / 60),
          subscribersGained: num(row[sgi]),
          subscribersLost: num(row[sli]),
          impressions: extra?.impressions ?? 0,
          ctr: Number((extra?.ctr ?? 0).toFixed(2)),
          engagementRate:
            views > 0
              ? Number((((likes + comments) / views) * 100).toFixed(2))
              : 0,
        };
      });

      if (metrics.length === 0) return this.fallback.getOverview(opts);

      // Channel summary for the active channel.
      const chResp = await dataApi<ChannelListResponse>(token, "channels", {
        part: "snippet,statistics",
        id: channelId,
      });
      const ch = chResp.items?.[0];
      const saved = findChannelLink(
        this.account.youtubeChannels ?? [],
        channelId
      );
      const channel: ChannelSummary = {
        id: channelId,
        title: ch?.snippet?.title ?? saved?.title ?? this.account.name,
        handle: ch?.snippet?.customUrl ?? saved?.handle ?? "",
        thumbnailUrl:
          ch?.snippet?.thumbnails?.default?.url ?? saved?.thumbnailUrl ?? "",
        subscriberCount: num(ch?.statistics?.subscriberCount),
        totalViews: num(ch?.statistics?.viewCount),
        videoCount: num(ch?.statistics?.videoCount),
      };

      const snapshot = computeSnapshot(metrics);
      const anomalies = detectAnomalies(metrics);
      const pulse = computePulse(metrics, this.account.streak);
      const insights = cannedInsights(snapshot, anomalies);

      return { channel, snapshot, metrics, anomalies, pulse, insights };
    } catch {
      return this.fallback.getOverview(opts);
    }
  }

  async getVideos(): Promise<VideoSummary[]> {
    try {
      const token = await this.token();
      const channelId = this.channelId();
      const search = await dataApi<SearchResponse>(token, "search", {
        part: "id",
        channelId,
        type: "video",
        order: "date",
        maxResults: "25",
      });
      const ids = (search.items ?? [])
        .map((i) => i.id?.videoId)
        .filter((x): x is string => Boolean(x));
      if (ids.length === 0) return [];

      const vids = await dataApi<VideoListResponse>(token, "videos", {
        part: "snippet,statistics,contentDetails",
        id: ids.join(","),
      });

      return (vids.items ?? []).map((v) => this.toSummary(v));
    } catch {
      return this.fallback.getVideos();
    }
  }

  async getVideo(id: string): Promise<VideoDetail | null> {
    try {
      const token = await this.token();
      const vids = await dataApi<VideoListResponse>(token, "videos", {
        part: "snippet,statistics,contentDetails",
        id,
      });
      const v = vids.items?.[0];
      if (!v) return null;

      const summary = this.toSummary(v);

      // Best-effort per-video traffic sources.
      let trafficSources: VideoDetail["trafficSources"] = [];
      try {
        const traffic = await analyticsReport(token, {
          ids: this.analyticsIds(),
          startDate: isoDaysAgo(90),
          endDate: isoToday(),
          metrics: "views",
          dimensions: "insightTrafficSourceType",
          sort: "-views",
          filters: `video==${id}`,
          maxResults: "5",
        });
        const ti = colIndex(traffic, "insightTrafficSourceType");
        const tvi = colIndex(traffic, "views");
        const rows = traffic.rows ?? [];
        const total = rows.reduce((a, r) => a + num(r[tvi]), 0) || 1;
        trafficSources = rows.map((r) => ({
          source: String(r[ti]),
          pct: Math.round((num(r[tvi]) / total) * 100),
        }));
      } catch {
        /* optional */
      }

      return {
        ...summary,
        description: v.snippet?.description ?? "",
        tags: v.snippet?.tags ?? [],
        dailyViews: [],
        retentionCurve: [],
        trafficSources,
      };
    } catch {
      return this.fallback.getVideo(id);
    }
  }

  async updateVideo(
    id: string,
    patch: { title?: string; description?: string; tags?: string[] }
  ): Promise<VideoSummary | null> {
    try {
      const token = await this.token();
      const current = await dataApi<VideoListResponse>(token, "videos", {
        part: "snippet",
        id,
      });
      const v = current.items?.[0];
      if (!v?.snippet) return this.fallback.updateVideo(id, patch);

      const snippet = {
        title: patch.title ?? v.snippet.title,
        description: patch.description ?? v.snippet.description,
        tags: patch.tags ?? v.snippet.tags,
        categoryId: v.snippet.categoryId ?? "22",
      };

      await dataApiPut(token, "videos", { part: "snippet" }, { id, snippet });

      const refreshed = await dataApi<VideoListResponse>(token, "videos", {
        part: "snippet,statistics,contentDetails",
        id,
      });
      const updated = refreshed.items?.[0];
      return updated ? this.toSummary(updated) : null;
    } catch {
      return this.fallback.updateVideo(id, patch);
    }
  }

  private toSummary(v: NonNullable<VideoListResponse["items"]>[number]): VideoSummary {
    const views = num(v.statistics?.viewCount);
    const likes = num(v.statistics?.likeCount);
    const comments = num(v.statistics?.commentCount);
    return {
      id: v.id,
      title: v.snippet?.title ?? "Untitled",
      thumbnailUrl:
        v.snippet?.thumbnails?.medium?.url ??
        v.snippet?.thumbnails?.high?.url ??
        "",
      publishedAt: v.snippet?.publishedAt ?? new Date().toISOString(),
      durationSeconds: parseDuration(v.contentDetails?.duration ?? ""),
      views,
      likes,
      comments,
      watchTimeHours: 0,
      avgViewDurationSeconds: 0,
      ctr: 0,
      engagementRate:
        views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0,
      retentionPct: 0,
    };
  }
}
