import type { ChannelRole, ChannelSummary, VideoSummary } from "@tubepath/core";
import { buildDailyMetric, computeEngagementRate } from "@tubepath/core";
import { QUOTA_COSTS } from "./quota";

const YT_DATA_BASE = "https://www.googleapis.com/youtube/v3";
const YT_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";

export interface YouTubeClientOptions {
  accessToken: string;
  onQuotaUse?: (units: number) => void;
}

async function ytFetch<T>(
  url: string,
  accessToken: string,
  onQuotaUse?: (units: number) => void,
  quotaUnits = 1
): Promise<T> {
  onQuotaUse?.(quotaUnits);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

interface ChannelsListResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      thumbnails?: { default?: { url?: string } };
    };
    statistics?: { subscriberCount?: string };
  }>;
}

export async function listMyChannels(
  opts: YouTubeClientOptions
): Promise<ChannelSummary[]> {
  const url = `${YT_DATA_BASE}/channels?part=snippet,statistics&mine=true&maxResults=50`;
  const data = await ytFetch<ChannelsListResponse>(
    url,
    opts.accessToken,
    opts.onQuotaUse,
    QUOTA_COSTS.channelsList
  );

  return (data.items ?? []).map((item) => ({
    id: item.id,
    youtubeChannelId: item.id,
    title: item.snippet?.title ?? "Unknown Channel",
    thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? "",
    role: "owner" as ChannelRole,
    subscriberCount: parseInt(item.statistics?.subscriberCount ?? "0", 10),
  }));
}

interface AnalyticsReportResponse {
  columnHeaders?: Array<{ name?: string }>;
  rows?: Array<Array<string | number>>;
}

export async function fetchChannelDailyMetrics(
  opts: YouTubeClientOptions & {
    channelId: string;
    startDate: string;
    endDate: string;
  }
) {
  const params = new URLSearchParams({
    ids: `channel==${opts.channelId}`,
    startDate: opts.startDate,
    endDate: opts.endDate,
    metrics: "views,likes,comments,subscribersGained,subscribersLost",
    dimensions: "day",
    sort: "day",
  });

  const url = `${YT_ANALYTICS_BASE}/reports?${params}`;
  const data = await ytFetch<AnalyticsReportResponse>(
    url,
    opts.accessToken,
    opts.onQuotaUse,
    QUOTA_COSTS.analyticsQuery
  );

  const headers = (data.columnHeaders ?? []).map((h) => h.name ?? "");
  const dayIdx = headers.indexOf("day");

  return (data.rows ?? []).map((row) => {
    const get = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? Number(row[idx]) : 0;
    };
    const dateRaw = String(row[dayIdx] ?? "");
    const date =
      dateRaw.length === 8
        ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
        : dateRaw;

    return buildDailyMetric({
      date,
      views: get("views"),
      likes: get("likes"),
      comments: get("comments"),
      subscribersGained: get("subscribersGained"),
      subscribersLost: get("subscribersLost"),
    });
  });
}

interface VideosListResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: { medium?: { url?: string } };
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

export async function listChannelVideos(
  opts: YouTubeClientOptions & { channelId: string; maxResults?: number }
): Promise<VideoSummary[]> {
  const params = new URLSearchParams({
    part: "snippet,statistics",
    channelId: opts.channelId,
    order: "date",
    maxResults: String(opts.maxResults ?? 25),
  });
  const url = `${YT_DATA_BASE}/search?${params}`;
  // search.list costs 100 units - use playlistItems when uploads playlist known
  // For channel videos via search:
  const searchParams = new URLSearchParams({
    part: "snippet",
    channelId: opts.channelId,
    type: "video",
    order: "date",
    maxResults: String(opts.maxResults ?? 25),
  });
  const searchUrl = `${YT_DATA_BASE}/search?${searchParams}`;
  const searchData = await ytFetch<{ items?: Array<{ id?: { videoId?: string } }> }>(
    searchUrl,
    opts.accessToken,
    opts.onQuotaUse,
    QUOTA_COSTS.searchList
  );

  const videoIds = (searchData.items ?? [])
    .map((i) => i.id?.videoId)
    .filter(Boolean) as string[];

  if (videoIds.length === 0) return [];

  const videosUrl = `${YT_DATA_BASE}/videos?part=snippet,statistics&id=${videoIds.join(",")}`;
  const data = await ytFetch<VideosListResponse>(
    videosUrl,
    opts.accessToken,
    opts.onQuotaUse,
    QUOTA_COSTS.videosList
  );

  return (data.items ?? []).map((item) => {
    const views = parseInt(item.statistics?.viewCount ?? "0", 10);
    const likes = parseInt(item.statistics?.likeCount ?? "0", 10);
    const comments = parseInt(item.statistics?.commentCount ?? "0", 10);
    return {
      id: item.id,
      youtubeVideoId: item.id,
      title: item.snippet?.title ?? "Untitled",
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
      views,
      likes,
      comments,
      engagementRate: computeEngagementRate(likes, comments, views),
    };
  });
}

export async function getChannelById(
  opts: YouTubeClientOptions & { channelId: string }
): Promise<ChannelSummary | null> {
  const url = `${YT_DATA_BASE}/channels?part=snippet,statistics&id=${opts.channelId}`;
  const data = await ytFetch<ChannelsListResponse>(
    url,
    opts.accessToken,
    opts.onQuotaUse,
    QUOTA_COSTS.channelsList
  );
  const item = data.items?.[0];
  if (!item) return null;
  return {
    id: item.id,
    youtubeChannelId: item.id,
    title: item.snippet?.title ?? "Unknown",
    thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? "",
    role: "owner",
    subscriberCount: parseInt(item.statistics?.subscriberCount ?? "0", 10),
  };
}

export async function updateVideoMetadata(
  opts: YouTubeClientOptions & {
    videoId: string;
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  }
): Promise<void> {
  const body: Record<string, unknown> = {
    id: opts.videoId,
    snippet: {},
  };
  const snippet = body.snippet as Record<string, unknown>;
  if (opts.title) snippet.title = opts.title;
  if (opts.description) snippet.description = opts.description;
  if (opts.tags) snippet.tags = opts.tags;
  if (opts.categoryId) snippet.categoryId = opts.categoryId;

  opts.onQuotaUse?.(QUOTA_COSTS.videosUpdate);
  const res = await fetch(`${YT_DATA_BASE}/videos?part=snippet`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update video: ${text}`);
  }
}

export function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.has("v")) return u.searchParams.get("v");
    const match = u.pathname.match(/\/(shorts|embed|v)\/([^/?]+)/);
    return match?.[2] ?? null;
  } catch {
    return null;
  }
}

export function parseYouTubeChannelId(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/(channel|c|@)\/([^/?]+)/);
    return match?.[2] ?? null;
  } catch {
    return null;
  }
}

export async function getVideoById(
  opts: YouTubeClientOptions & { videoId: string }
): Promise<VideoSummary | null> {
  const url = `${YT_DATA_BASE}/videos?part=snippet,statistics&id=${opts.videoId}`;
  const data = await ytFetch<VideosListResponse>(
    url,
    opts.accessToken,
    opts.onQuotaUse,
    QUOTA_COSTS.videosList
  );
  const item = data.items?.[0];
  if (!item) return null;
  const views = parseInt(item.statistics?.viewCount ?? "0", 10);
  const likes = parseInt(item.statistics?.likeCount ?? "0", 10);
  const comments = parseInt(item.statistics?.commentCount ?? "0", 10);
  return {
    id: item.id,
    youtubeVideoId: item.id,
    title: item.snippet?.title ?? "Untitled",
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? "",
    publishedAt: item.snippet?.publishedAt ?? "",
    views,
    likes,
    comments,
    engagementRate: computeEngagementRate(likes, comments, views),
  };
}
