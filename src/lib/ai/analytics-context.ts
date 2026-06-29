import type { Account } from "@/lib/types";
import { getCredentials } from "@/lib/store";
import { canLoadYouTubeData, getDataProvider } from "@/lib/data/provider";
import { getAccessToken } from "@/lib/data/youtube-client";
import { requireChannelId } from "@/lib/youtube/channels";
import { discoverCompetitors } from "@/lib/pipeline/competitors";
import { extractTopicFromTitles } from "@/lib/pipeline/game-extract";
import { patternLabel, patternFromSources } from "@/lib/pipeline/traffic";
import { dataApi } from "@/lib/data/youtube-client";

export interface AnalyticsFact {
  label: string;
  value: string;
  delta?: string;
  source: "your_analytics" | "public";
}

export interface CompetitorBenchmark {
  channelTitle: string;
  subscriberCount: number;
  matchScore: number;
  isPublicData: true;
}

export interface RichAnalyticsContext {
  youtubeConnected: boolean;
  thinData: boolean;
  dataDays: number;
  channelTitle: string;
  topic: string;
  facts: AnalyticsFact[];
  competitors: CompetitorBenchmark[];
  topVideoTitle: string;
  viewsChange: number;
  engagementChange: number;
  dominantPattern: string;
  /** Serialized block for Gemini prompts. */
  promptBlock: string;
}

interface ChannelListResponse {
  items?: {
    snippet?: { title?: string };
    statistics?: { subscriberCount?: string };
  }[];
}

export async function buildRichAnalyticsContext(
  account: Account
): Promise<RichAnalyticsContext> {
  const empty: RichAnalyticsContext = {
    youtubeConnected: false,
    thinData: true,
    dataDays: 0,
    channelTitle: account.name,
    topic: "",
    facts: [],
    competitors: [],
    topVideoTitle: "",
    viewsChange: 0,
    engagementChange: 0,
    dominantPattern: "unknown",
    promptBlock: "No YouTube data connected.",
  };

  if (!(await canLoadYouTubeData(account))) return empty;

  try {
    const provider = await getDataProvider(account);
    const [overview, videos] = await Promise.all([
      provider.getOverview({ historyDays: 90 }),
      provider.getVideos(),
    ]);

    const dataDays = overview.metrics.length;
    const thinData = dataDays < 14;
    const topVideo = [...videos].sort((a, b) => b.views - a.views)[0];
    const topic = extractTopicFromTitles(videos.slice(0, 10).map((v) => v.title));

    const facts: AnalyticsFact[] = [
      {
        label: "Views (28d)",
        value: overview.snapshot.views.toLocaleString(),
        delta: formatDelta(overview.snapshot.periodChange.views),
        source: "your_analytics",
      },
      {
        label: "Engagement rate",
        value: `${overview.snapshot.engagementRate.toFixed(1)}%`,
        delta: formatDelta(overview.snapshot.periodChange.engagement),
        source: "your_analytics",
      },
      {
        label: "Subscribers (28d net)",
        value: overview.snapshot.subscribers.toLocaleString(),
        delta: formatDelta(overview.snapshot.periodChange.subscribers),
        source: "your_analytics",
      },
      {
        label: "Watch time (28d hrs)",
        value: overview.snapshot.watchTimeHours.toLocaleString(),
        delta: formatDelta(overview.snapshot.periodChange.watchTime),
        source: "your_analytics",
      },
    ];

    if (overview.snapshot.ctr > 0) {
      facts.push({
        label: "CTR",
        value: `${overview.snapshot.ctr.toFixed(1)}%`,
        delta: formatDelta(overview.snapshot.periodChange.ctr),
        source: "your_analytics",
      });
    }

    let competitors: CompetitorBenchmark[] = [];
    let dominantPattern = "mixed";

    try {
      const creds = await getCredentials(account.id);
      if (creds?.refreshToken) {
        const token = await getAccessToken(creds);
        const channelId = requireChannelId(account);
        const ch = await dataApi<ChannelListResponse>(token, "channels", {
          part: "snippet,statistics",
          id: channelId,
        });
        const subs = Number(ch.items?.[0]?.statistics?.subscriberCount ?? 0);

        const found = await discoverCompetitors(token, channelId, subs, topic);
        competitors = found.map((c) => ({
          channelTitle: c.title,
          subscriberCount: c.subscriberCount,
          matchScore: c.matchScore,
          isPublicData: true as const,
        }));

        if (topVideo) {
          const detail = await provider.getVideo(topVideo.id);
          if (detail?.trafficSources?.length) {
            const kind = patternFromSources(detail.trafficSources);
            dominantPattern = patternLabel(kind);
          }
        }
      }
    } catch {
      /* competitor fetch optional */
    }

    const promptBlock = [
      `Channel: ${overview.channel.title}`,
      `Topic focus: ${topic}`,
      `Data days available: ${dataDays}${thinData ? " (THIN — warn user)" : ""}`,
      `Views change vs prior period: ${overview.snapshot.periodChange.views?.toFixed(1) ?? 0}%`,
      `Engagement change: ${overview.snapshot.periodChange.engagement?.toFixed(1) ?? 0}%`,
      `Top video: ${topVideo?.title ?? "n/a"} (${topVideo?.views.toLocaleString() ?? 0} views)`,
      `Dominant traffic pattern (top video): ${dominantPattern}`,
      `Competitors (public data): ${competitors.map((c) => `${c.channelTitle} (${c.subscriberCount} subs)`).join("; ") || "none found"}`,
      `Facts: ${facts.map((f) => `${f.label}=${f.value}${f.delta ? ` (${f.delta})` : ""}`).join("; ")}`,
    ].join("\n");

    return {
      youtubeConnected: true,
      thinData,
      dataDays,
      channelTitle: overview.channel.title,
      topic,
      facts,
      competitors,
      topVideoTitle: topVideo?.title ?? "",
      viewsChange: overview.snapshot.periodChange.views ?? 0,
      engagementChange: overview.snapshot.periodChange.engagement ?? 0,
      dominantPattern,
      promptBlock,
    };
  } catch {
    return empty;
  }
}

function formatDelta(v: number | undefined): string | undefined {
  if (v === undefined) return undefined;
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}
