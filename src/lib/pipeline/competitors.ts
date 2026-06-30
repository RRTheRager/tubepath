import { dataApi } from "@/lib/data/youtube-client";
import { competitorSubBounds, PIPELINE_MAX_COMPETITORS } from "./config";
import { searchQueryFromTopic } from "./game-extract";
import type { CompetitorChannel } from "./types";

interface SearchItem {
  id?: { videoId?: string };
  snippet?: {
    channelId?: string;
    channelTitle?: string;
    title?: string;
    publishedAt?: string;
  };
}

interface SearchResponse {
  items?: SearchItem[];
}

interface ChannelItem {
  id: string;
  snippet?: { title?: string; thumbnails?: { default?: { url?: string } } };
  statistics?: { subscriberCount?: string; videoCount?: string };
}

interface ChannelListResponse {
  items?: ChannelItem[];
}

interface VideoItem {
  id: string;
  snippet?: {
    title?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string } };
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
}

interface VideoListResponse {
  items?: VideoItem[];
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function discoverCompetitors(
  token: string,
  ownChannelId: string,
  subscriberCount: number,
  topic: string
): Promise<CompetitorChannel[]> {
  const q = searchQueryFromTopic(topic);
  const search = await dataApi<SearchResponse>(token, "search", {
    part: "snippet",
    type: "video",
    q,
    maxResults: "25",
    order: "viewCount",
    relevanceLanguage: "en",
  });

  const byChannel = new Map<
    string,
    { title: string; score: number; topics: Set<string> }
  >();

  for (const item of search.items ?? []) {
    const channelId = item.snippet?.channelId;
    if (!channelId || channelId === ownChannelId) continue;
    const title = item.snippet?.title ?? "";
    const entry = byChannel.get(channelId) ?? {
      title: item.snippet?.channelTitle ?? "Channel",
      score: 0,
      topics: new Set<string>(),
    };
    entry.score += 1;
    if (title.toLowerCase().includes(topic.toLowerCase())) entry.score += 2;
    entry.topics.add(topic);
    byChannel.set(channelId, entry);
  }

  const candidateIds = [...byChannel.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 12)
    .map(([id]) => id);
  if (!candidateIds.length) return [];

  const channels = await dataApi<ChannelListResponse>(token, "channels", {
    part: "snippet,statistics",
    id: candidateIds.join(","),
  });

  const { min, max } = competitorSubBounds(subscriberCount);
  const ranked: CompetitorChannel[] = [];

  for (const ch of channels.items ?? []) {
    const subs = num(ch.statistics?.subscriberCount);
    if (subs > 0 && (subs < min || subs > max)) continue;
    const meta = byChannel.get(ch.id);
    if (!meta) continue;
    ranked.push({
      id: ch.id,
      title: ch.snippet?.title ?? meta.title,
      thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? "",
      subscriberCount: subs,
      matchScore: meta.score,
      topics: [...meta.topics],
    });
  }

  ranked.sort((a, b) => {
    if (a.subscriberCount === 0 && b.subscriberCount > 0) return 1;
    if (b.subscriberCount === 0 && a.subscriberCount > 0) return -1;
    return b.matchScore - a.matchScore;
  });
  return ranked.slice(0, PIPELINE_MAX_COMPETITORS);
}

function titleMatchesTopic(title: string, topic: string): boolean {
  const words = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (!words.length) return true;
  const t = title.toLowerCase();
  return words.some((w) => t.includes(w));
}

export async function fetchCompetitorVideos(
  token: string,
  competitors: CompetitorChannel[],
  topic: string,
  perChannel = 2
): Promise<
  {
    id: string;
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnailUrl: string;
    publishedAt: string;
    views: number;
    likes: number;
    comments: number;
  }[]
> {
  const out: {
    id: string;
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnailUrl: string;
    publishedAt: string;
    views: number;
    likes: number;
    comments: number;
  }[] = [];

  for (const comp of competitors) {
    const search = await dataApi<SearchResponse>(token, "search", {
      part: "snippet",
      channelId: comp.id,
      type: "video",
      order: "date",
      maxResults: String(perChannel),
    });
    const ids = (search.items ?? [])
      .map((i) => i.id?.videoId)
      .filter((x): x is string => Boolean(x));
    if (!ids.length) continue;

    const vids = await dataApi<VideoListResponse>(token, "videos", {
      part: "snippet,statistics",
      id: ids.join(","),
    });

    const batch: typeof out = [];
    for (const v of vids.items ?? []) {
      const title = v.snippet?.title ?? "Untitled";
      batch.push({
        id: v.id,
        title,
        channelId: comp.id,
        channelTitle: comp.title,
        thumbnailUrl: v.snippet?.thumbnails?.medium?.url ?? "",
        publishedAt: v.snippet?.publishedAt ?? new Date().toISOString(),
        views: num(v.statistics?.viewCount),
        likes: num(v.statistics?.likeCount),
        comments: num(v.statistics?.commentCount),
      });
    }

    const filtered =
      topic.length > 2
        ? batch.filter((v) => titleMatchesTopic(v.title, topic))
        : batch;
    out.push(...(filtered.length ? filtered : batch));
  }

  return out;
}
