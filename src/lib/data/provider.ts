import type {
  Account,
  OverviewPayload,
  VideoDetail,
  VideoSummary,
} from "@/lib/types";
import { isYouTubeConfigured } from "@/lib/env";
import { getCredentials } from "@/lib/store";
import { MockProvider } from "./mock";
import { YouTubeProvider } from "./youtube";

export interface OverviewOptions {
  historyDays: number;
}

export interface DataProvider {
  getOverview(opts: OverviewOptions): Promise<OverviewPayload>;
  getVideos(): Promise<VideoSummary[]>;
  getVideo(id: string): Promise<VideoDetail | null>;
  /** Used by chatbot tool-calling actions to mutate metadata. */
  updateVideo(
    id: string,
    patch: { title?: string; description?: string; tags?: string[] }
  ): Promise<VideoSummary | null>;
}

/**
 * Choose the active provider for an account. The UI never knows which is used.
 * Real YouTube data is used automatically when OAuth is configured, the channel
 * is connected, and stored credentials exist; otherwise the mock provider.
 */
export async function getDataProvider(
  account?: Account
): Promise<DataProvider> {
  if (
    account &&
    isYouTubeConfigured() &&
    account.youtubeConnected &&
    account.youtubeChannelId
  ) {
    const creds = await getCredentials(account.id);
    if (creds?.refreshToken) {
      return new YouTubeProvider(account, creds);
    }
  }
  return new MockProvider();
}
