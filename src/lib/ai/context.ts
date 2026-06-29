import type { Account, VideoSummary } from "@/lib/types";
import { buildRichAnalyticsContext } from "./analytics-context";
import type { AiChannelContext } from "./index";

export async function buildAiContext(account: Account): Promise<{
  ctx: AiChannelContext;
  videos: VideoSummary[];
  youtubeConnected: boolean;
  richPrompt: string;
  thinData: boolean;
}> {
  const rich = await buildRichAnalyticsContext(account);

  if (!rich.youtubeConnected) {
    return {
      youtubeConnected: false,
      thinData: true,
      richPrompt: rich.promptBlock,
      ctx: {
        channelTitle: account.name,
        viewsChange: 0,
        engagementChange: 0,
        topVideoTitle: "",
      },
      videos: [],
    };
  }

  const { getDataProvider } = await import("@/lib/data/provider");
  const provider = await getDataProvider(account);
  const videos = await provider.getVideos();

  return {
    youtubeConnected: true,
    thinData: rich.thinData,
    richPrompt: rich.promptBlock,
    ctx: {
      channelTitle: rich.channelTitle,
      viewsChange: rich.viewsChange,
      engagementChange: rich.engagementChange,
      topVideoTitle: rich.topVideoTitle,
    },
    videos,
  };
}
