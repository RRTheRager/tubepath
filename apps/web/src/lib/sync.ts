import type { DailyMetric } from "@tubepath/core";
import { buildDailyMetric, computeEngagementRate, detectAnomalies } from "@tubepath/core";
import {
  fetchChannelDailyMetrics,
  listChannelVideos,
  listMyChannels,
} from "@tubepath/youtube";
import { isDemoMode } from "./env";
import { getDemoPulseData, getDemoVideos } from "./demo-data";

export async function syncChannelMetrics(
  accessToken: string,
  channelId: string,
  historyDays: number
): Promise<DailyMetric[]> {
  if (isDemoMode()) {
    return getDemoPulseData().metrics.slice(-historyDays);
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - historyDays);

  return fetchChannelDailyMetrics({
    accessToken,
    channelId,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  });
}

export async function discoverChannels(accessToken: string) {
  if (isDemoMode()) {
    const { DEMO_CHANNELS } = await import("./demo-data");
    return DEMO_CHANNELS;
  }
  return listMyChannels({ accessToken });
}

export async function syncVideos(accessToken: string, channelId: string) {
  if (isDemoMode()) {
    return getDemoVideos();
  }
  return listChannelVideos({ accessToken, channelId });
}

export async function runSpikeDetection(metrics: DailyMetric[]) {
  return detectAnomalies(metrics, "engagement");
}

export function aggregateMetricsForStorage(metrics: DailyMetric[]) {
  return metrics.map((m) => ({
    date: m.date,
    views: m.views,
    subscribers_gained: m.subscribersGained,
    subscribers_lost: m.subscribersLost,
    likes: m.likes,
    comments: m.comments,
    engagement_rate: m.engagementRate,
  }));
}

export function videoToStorage(v: {
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
}) {
  return {
    youtube_video_id: v.youtubeVideoId,
    title: v.title,
    thumbnail_url: v.thumbnailUrl,
    published_at: v.publishedAt,
    engagement_rate: computeEngagementRate(v.likes, v.comments, v.views),
  };
}

export { buildDailyMetric };
