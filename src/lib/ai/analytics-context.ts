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

export interface AnalyticsComparison {
  label: string;
  detail: string;
  source: "your_analytics" | "public";
}

export interface RichAnalyticsContext {
  youtubeConnected: boolean;
  thinData: boolean;
  dataDays: number;
  windowDays: number;
  channelTitle: string;
  topic: string;
  facts: AnalyticsFact[];
  comparisons: AnalyticsComparison[];
  competitors: CompetitorBenchmark[];
  topVideoTitle: string;
  viewsChange: number;
  engagementChange: number;
  dominantPattern: string;
  promptBlock: string;
}

interface ChannelListResponse {
  items?: {
    snippet?: { title?: string };
    statistics?: { subscriberCount?: string };
  }[];
}

function formatDelta(v: number | undefined): string | undefined {
  if (v === undefined) return undefined;
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function buildComparisons(
  snapshot: Awaited<
    ReturnType<Awaited<ReturnType<typeof getDataProvider>>["getOverview"]>
  >["snapshot"],
  windowDays: number,
  competitors: CompetitorBenchmark[],
  channelSubs: number
): AnalyticsComparison[] {
  const out: AnalyticsComparison[] = [];

  const viewsCh = snapshot.periodChange.views;
  if (viewsCh !== undefined) {
    out.push({
      label: `Views (${windowDays}d vs prior ${windowDays}d)`,
      detail: `${formatDelta(viewsCh) ?? "0%"} change (${snapshot.views.toLocaleString()} views this period)`,
      source: "your_analytics",
    });
  }

  const engCh = snapshot.periodChange.engagement;
  if (engCh !== undefined) {
    out.push({
      label: "Overall engagement rate",
      detail: `${snapshot.engagementRate.toFixed(2)}% now (${formatDelta(engCh) ?? "0%"} vs prior period). Likes + comments ÷ views.`,
      source: "your_analytics",
    });
  }

  if (snapshot.engagementRateShorts > 0 || snapshot.engagementRateLong > 0) {
    out.push({
      label: "Long-form vs Shorts engagement",
      detail: `Long-form: ${snapshot.engagementRateLong.toFixed(2)}% · Shorts: ${snapshot.engagementRateShorts.toFixed(2)}% (same period, by video length)`,
      source: "your_analytics",
    });
  }

  const subsCh = snapshot.periodChange.subscribers;
  if (subsCh !== undefined) {
    out.push({
      label: `Net subscribers (${windowDays}d)`,
      detail: `${snapshot.subscribers >= 0 ? "+" : ""}${snapshot.subscribers.toLocaleString()} net (${formatDelta(subsCh) ?? "0%"} vs prior period)`,
      source: "your_analytics",
    });
  }

  for (const c of competitors.slice(0, 3)) {
    const ratio =
      channelSubs > 0 && c.subscriberCount > 0
        ? (channelSubs / c.subscriberCount).toFixed(2)
        : null;
    out.push({
      label: `vs ${c.channelTitle}`,
      detail: ratio
        ? `You have ${channelSubs.toLocaleString()} subs; they have ${c.subscriberCount.toLocaleString()} (${ratio}× your size). Public data.`
        : `${c.channelTitle}: ${c.subscriberCount.toLocaleString()} subs (public data).`,
      source: "public",
    });
  }

  return out;
}

export async function buildRichAnalyticsContext(
  account: Account,
  windowDays = 28
): Promise<RichAnalyticsContext> {
  const empty: RichAnalyticsContext = {
    youtubeConnected: false,
    thinData: true,
    dataDays: 0,
    windowDays,
    channelTitle: account.name,
    topic: "",
    facts: [],
    comparisons: [],
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
      provider.getOverview({ historyDays: 90, windowDays }),
      provider.getVideos(),
    ]);

    const dataDays = overview.metrics.length;
    const thinData = dataDays < 14;
    const topVideo = [...videos].sort((a, b) => b.views - a.views)[0];
    const topic = extractTopicFromTitles(videos.slice(0, 10).map((v) => v.title));
    const daysLabel = `${windowDays}d`;

    const facts: AnalyticsFact[] = [
      {
        label: `Views (${daysLabel})`,
        value: overview.snapshot.views.toLocaleString(),
        delta: formatDelta(overview.snapshot.periodChange.views),
        source: "your_analytics",
      },
      {
        label: "Engagement (overall)",
        value: `${overview.snapshot.engagementRate.toFixed(2)}%`,
        delta: formatDelta(overview.snapshot.periodChange.engagement),
        source: "your_analytics",
      },
      {
        label: "Engagement (long-form)",
        value: `${overview.snapshot.engagementRateLong.toFixed(2)}%`,
        delta: formatDelta(overview.snapshot.engagementLongChange),
        source: "your_analytics",
      },
      {
        label: "Engagement (Shorts)",
        value:
          overview.snapshot.engagementRateShorts > 0
            ? `${overview.snapshot.engagementRateShorts.toFixed(2)}%`
            : "—",
        delta: formatDelta(overview.snapshot.engagementShortsChange),
        source: "your_analytics",
      },
      {
        label: `Net subscribers (${daysLabel})`,
        value: overview.snapshot.subscribers.toLocaleString(),
        delta: formatDelta(overview.snapshot.periodChange.subscribers),
        source: "your_analytics",
      },
      {
        label: `Watch time (${daysLabel})`,
        value: `${overview.snapshot.watchTimeHours.toLocaleString()} hrs`,
        delta: formatDelta(overview.snapshot.periodChange.watchTime),
        source: "your_analytics",
      },
    ];

    if (overview.snapshot.ctr > 0) {
      facts.push({
        label: "CTR",
        value: `${overview.snapshot.ctr.toFixed(2)}%`,
        delta: formatDelta(overview.snapshot.periodChange.ctr),
        source: "your_analytics",
      });
    }

    let competitors: CompetitorBenchmark[] = [];
    let dominantPattern = "mixed";
    let channelSubs = 0;

    try {
      const creds = await getCredentials(account.id);
      if (creds?.refreshToken) {
        const token = await getAccessToken(creds);
        const channelId = requireChannelId(account);
        const ch = await dataApi<ChannelListResponse>(token, "channels", {
          part: "snippet,statistics",
          id: channelId,
        });
        channelSubs = Number(ch.items?.[0]?.statistics?.subscriberCount ?? 0);

        const found = await discoverCompetitors(token, channelId, channelSubs, topic);
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

    const comparisons = buildComparisons(
      overview.snapshot,
      windowDays,
      competitors,
      channelSubs
    );

    const promptBlock = [
      `Channel: ${overview.channel.title}`,
      `Topic focus: ${topic}`,
      `Analysis window: ${windowDays} days`,
      `Data days available: ${dataDays}${thinData ? " (THIN — warn user)" : ""}`,
      `Views change vs prior period: ${overview.snapshot.periodChange.views?.toFixed(1) ?? 0}%`,
      `Engagement change: ${overview.snapshot.periodChange.engagement?.toFixed(1) ?? 0}%`,
      `Long-form engagement: ${overview.snapshot.engagementRateLong.toFixed(2)}%`,
      `Shorts engagement: ${overview.snapshot.engagementRateShorts.toFixed(2)}%`,
      `Top video: ${topVideo?.title ?? "n/a"} (${topVideo?.views.toLocaleString() ?? 0} views)`,
      `Dominant traffic pattern (top video): ${dominantPattern}`,
      `Competitors (public data): ${competitors.map((c) => `${c.channelTitle} (${c.subscriberCount} subs)`).join("; ") || "none found"}`,
      `Facts: ${facts.map((f) => `${f.label}=${f.value}${f.delta ? ` (${f.delta})` : ""}`).join("; ")}`,
      `Comparisons: ${comparisons.map((c) => `${c.label}: ${c.detail}`).join(" | ")}`,
    ].join("\n");

    return {
      youtubeConnected: true,
      thinData,
      dataDays,
      windowDays,
      channelTitle: overview.channel.title,
      topic,
      facts,
      comparisons,
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
