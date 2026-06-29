import type { Account } from "@/lib/types";
import { getCredentials } from "@/lib/store";
import { getAccessToken, analyticsReport, dataApi, isoDaysAgo, isoToday } from "@/lib/data/youtube-client";
import { analyticsIds, requireChannelId } from "@/lib/youtube/channels";
import { canLoadYouTubeData } from "@/lib/data/provider";
import { isAiConfigured } from "@/lib/env";
import { geminiJson } from "@/lib/ai/gemini";
import { discoverCompetitors, fetchCompetitorVideos } from "./competitors";
import { extractTopicFromTitles } from "./game-extract";
import { PIPELINE_CACHE_TTL_MS } from "./config";
import {
  buildFunnel,
  inferPublicPattern,
  patternFromSources,
  patternLabel,
  performanceTier,
} from "./traffic";
import type {
  PipelineAdvice,
  PipelinePayload,
  PipelineVideo,
  TrafficPatternKind,
} from "./types";

const g = globalThis as unknown as {
  __tubepathPipelineCache?: Map<string, { value: PipelinePayload; expires: number }>;
};
const cache =
  g.__tubepathPipelineCache ??
  (g.__tubepathPipelineCache = new Map());

interface VideoListResponse {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: { medium?: { url?: string } };
    };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  }[];
}

interface ChannelListResponse {
  items?: {
    snippet?: { title?: string };
    statistics?: { subscriberCount?: string };
  }[];
}

function colIndex(headers: { name: string }[], name: string): number {
  return headers.findIndex((c) => c.name === name);
}

async function ownRecentVideos(
  token: string,
  channelId: string,
  limit = 8
): Promise<PipelineVideo[]> {
  const search = await dataApi<{ items?: { id?: { videoId?: string } }[] }>(
    token,
    "search",
    {
      part: "id",
      channelId,
      type: "video",
      order: "date",
      maxResults: String(limit),
    }
  );
  const ids = (search.items ?? [])
    .map((i) => i.id?.videoId)
    .filter((x): x is string => Boolean(x));
  if (!ids.length) return [];

  const vids = await dataApi<VideoListResponse>(token, "videos", {
    part: "snippet,statistics",
    id: ids.join(","),
  });

  const idsAnalytics = analyticsIds(channelId);
  const videos: PipelineVideo[] = [];

  for (const v of vids.items ?? []) {
    const views = Number(v.statistics?.viewCount ?? 0);
    const likes = Number(v.statistics?.likeCount ?? 0);
    const comments = Number(v.statistics?.commentCount ?? 0);
    const engagementRate =
      views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0;

    let sources: { source: string; pct: number }[] = [];
    try {
      const traffic = await analyticsReport(token, {
        ids: idsAnalytics,
        startDate: isoDaysAgo(90),
        endDate: isoToday(),
        metrics: "views",
        dimensions: "insightTrafficSourceType",
        filters: `video==${v.id}`,
        maxResults: "8",
      });
      const ti = colIndex(traffic.columnHeaders, "insightTrafficSourceType");
      const tvi = colIndex(traffic.columnHeaders, "views");
      const rows = traffic.rows ?? [];
      const total = rows.reduce((a, r) => a + Number(r[tvi] ?? 0), 0) || 1;
      sources = rows.map((r) => ({
        source: String(r[ti]),
        pct: Math.round((Number(r[tvi] ?? 0) / total) * 100),
      }));
    } catch {
      /* optional per-video analytics */
    }

    const pattern = sources.length
      ? patternFromSources(sources)
      : inferPublicPattern(views, v.snippet?.publishedAt ?? "", v.snippet?.title ?? "");

    videos.push({
      id: v.id,
      title: v.snippet?.title ?? "Untitled",
      channelId,
      channelTitle: "",
      thumbnailUrl: v.snippet?.thumbnails?.medium?.url ?? "",
      publishedAt: v.snippet?.publishedAt ?? new Date().toISOString(),
      views,
      engagementRate,
      topic: "",
      pattern,
      performance: "average",
      isOwn: true,
      isPublicData: false,
    });
  }

  const medianViews =
    videos.length > 0
      ? [...videos].sort((a, b) => a.views - b.views)[
          Math.floor(videos.length / 2)
        ]!.views
      : 0;

  return videos.map((v) => ({
    ...v,
    performance: performanceTier(v.views, v.engagementRate, medianViews),
  }));
}

function defaultAdvice(
  topic: string,
  target: TrafficPatternKind,
  teaser: boolean
): PipelineAdvice {
  const label = patternLabel(target);
  return {
    headline: teaser
      ? `Creators winning on "${topic}" lean ${label.toLowerCase()}`
      : `Target a ${label.toLowerCase()} path for "${topic}"`,
    summary: teaser
      ? `Top performers in this niche cluster around ${label.toLowerCase()} discovery. Upgrade to see the full funnel, competitor breakdown, and step-by-step targets.`
      : `Strong uploads in this topic share a ${label.toLowerCase()} discovery pattern. Double down on titles and thumbnails that fit that entry point.`,
    bullets: teaser
      ? [
          "Match the discovery path your top competitors use",
          "Study strong vs weak uploads in the same game",
          "Upgrade for full funnel + competitor list",
        ]
      : [
          `Prioritize ${label.toLowerCase()} discovery hooks in titles`,
          "Compare your traffic mix to the strongest competitor uploads",
          "Avoid copying weak paths — low engagement often means wrong entry point",
          "Batch uploads when your topic is trending in search",
        ],
    targetPattern: target,
    isTeaser: teaser,
  };
}

async function buildAdvice(
  payload: Omit<PipelinePayload, "advice" | "generatedAt">,
  teaser: boolean
): Promise<PipelineAdvice> {
  const strong = [...payload.competitorVideos, ...payload.ownVideos].filter(
    (v) => v.performance === "strong"
  );
  const target: TrafficPatternKind =
    strong[0]?.pattern ??
    (payload.funnel[0]?.label.includes("Search")
      ? "search"
      : payload.funnel[0]?.label.includes("Suggested")
        ? "suggested"
        : "browse");

  if (!isAiConfigured() || teaser) {
    return defaultAdvice(payload.topic, target as TrafficPatternKind, teaser);
  }

  try {
    const system =
      'You are a YouTube analytics strategist. Return JSON {"headline","summary","bullets":string[],"targetPattern":"suggested|browse|search|external|mixed"}. Use ONLY the data provided. Cite view counts and patterns. No generic tips.';
    const result = await geminiJson<{
      headline: string;
      summary: string;
      bullets: string[];
      targetPattern: TrafficPatternKind;
    }>(
      system,
      JSON.stringify({
        topic: payload.topic,
        thinData: payload.thinData,
        funnel: payload.funnel,
        ownTop: payload.ownVideos.slice(0, 5),
        competitorTop: payload.competitorVideos.slice(0, 8),
        competitors: payload.competitors,
      })
    );
    return { ...result, isTeaser: false };
  } catch {
    return defaultAdvice(payload.topic, target as TrafficPatternKind, teaser);
  }
}

export async function buildPipeline(
  account: Account,
  opts: { teaser: boolean; dataDays?: number }
): Promise<PipelinePayload> {
  if (!(await canLoadYouTubeData(account))) {
    throw new Error("YouTube not connected");
  }

  const cacheKey = `${account.id}:${opts.teaser ? "t" : "f"}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.value;

  const creds = await getCredentials(account.id);
  if (!creds?.refreshToken) throw new Error("YouTube not connected");

  const token = await getAccessToken(creds);
  const channelId = requireChannelId(account);

  const chResp = await dataApi<ChannelListResponse>(token, "channels", {
    part: "snippet,statistics",
    id: channelId,
  });
  const ch = chResp.items?.[0];
  const subscriberCount = Number(ch?.statistics?.subscriberCount ?? 0);

  const ownVideosRaw = await ownRecentVideos(token, channelId);
  const titles = ownVideosRaw.map((v) => v.title);
  const topic = extractTopicFromTitles(titles);

  const competitors = await discoverCompetitors(
    token,
    channelId,
    subscriberCount,
    topic
  );

  const compRaw = await fetchCompetitorVideos(token, competitors, topic);
  const compViews = compRaw.map((v) => v.views);
  const medianComp =
    compViews.length > 0
      ? [...compViews].sort((a, b) => a - b)[Math.floor(compViews.length / 2)]!
      : 1000;

  const competitorVideos: PipelineVideo[] = compRaw.map((v) => {
    const engagementRate =
      v.views > 0
        ? Number((((v.likes + v.comments) / v.views) * 100).toFixed(2))
        : 0;
    const pattern = inferPublicPattern(v.views, v.publishedAt, v.title);
    return {
      id: v.id,
      title: v.title,
      channelId: v.channelId,
      channelTitle: v.channelTitle,
      thumbnailUrl: v.thumbnailUrl,
      publishedAt: v.publishedAt,
      views: v.views,
      engagementRate,
      topic,
      pattern,
      performance: performanceTier(v.views, engagementRate, medianComp),
      isOwn: false,
      isPublicData: true,
    };
  });

  const ownVideos = ownVideosRaw.map((v) => ({ ...v, topic }));

  const allForFunnel = [...competitorVideos, ...ownVideos];
  const funnel = buildFunnel(allForFunnel);

  const dataDays = opts.dataDays ?? 30;
  const thinData = dataDays < 14 || ownVideos.length < 3;

  const partial = {
    topic,
    dataDays,
    thinData,
    funnel,
    ownVideos,
    competitorVideos,
    competitors,
  };

  const advice = await buildAdvice(partial, opts.teaser);

  const payload: PipelinePayload = {
    ...partial,
    advice,
    generatedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, { value: payload, expires: Date.now() + PIPELINE_CACHE_TTL_MS });
  return payload;
}
