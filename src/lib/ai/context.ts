import { getDataProvider, YouTubeNotConnectedError } from "@/lib/data/provider";
import type { Account, VideoSummary } from "@/lib/types";
import type { AiChannelContext } from "./index";

export async function buildAiContext(account: Account): Promise<{
  ctx: AiChannelContext;
  videos: VideoSummary[];
  youtubeConnected: boolean;
}> {
  try {
    const provider = await getDataProvider(account);
    const [overview, videos] = await Promise.all([
      provider.getOverview({ historyDays: 90 }),
      provider.getVideos(),
    ]);

    const topVideo = [...videos].sort((a, b) => b.views - a.views)[0];

    return {
      youtubeConnected: true,
      ctx: {
        channelTitle: overview.channel.title,
        viewsChange: overview.snapshot.periodChange.views ?? 0,
        engagementChange: overview.snapshot.periodChange.engagement ?? 0,
        topVideoTitle: topVideo?.title ?? "your latest video",
      },
      videos,
    };
  } catch (err) {
    if (err instanceof YouTubeNotConnectedError) {
      return {
        youtubeConnected: false,
        ctx: {
          channelTitle: account.name,
          viewsChange: 0,
          engagementChange: 0,
          topVideoTitle: "",
        },
        videos: [],
      };
    }
    throw err;
  }
}
