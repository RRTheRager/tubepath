import type {
  Account,
  OverviewPayload,
  VideoDetail,
  VideoSummary,
} from "@/lib/types";
import { isYouTubeConfigured } from "@/lib/env";
import { getCredentials } from "@/lib/store";
import { YouTubeProvider } from "./youtube";

export interface OverviewOptions {
  historyDays: number;
  /** Window for snapshot + engagement split (defaults to 28). */
  windowDays?: number;
}

export interface DataProvider {
  getOverview(opts: OverviewOptions): Promise<OverviewPayload>;
  getVideos(): Promise<VideoSummary[]>;
  getVideo(id: string): Promise<VideoDetail | null>;
  updateVideo(
    id: string,
    patch: { title?: string; description?: string; tags?: string[] }
  ): Promise<VideoSummary | null>;
}

/** True when OAuth is configured and we can load live channel data. */
export async function canLoadYouTubeData(account: Account): Promise<boolean> {
  if (!isYouTubeConfigured() || !account.youtubeChannelId) return false;
  const creds = await getCredentials(account.id);
  return Boolean(creds?.refreshToken);
}

/** Returns the YouTube data provider — never serves demo/mock analytics. */
export async function getDataProvider(account: Account): Promise<DataProvider> {
  if (!(await canLoadYouTubeData(account))) {
    throw new YouTubeNotConnectedError();
  }
  const creds = await getCredentials(account.id);
  return new YouTubeProvider(account, creds!);
}

export class YouTubeNotConnectedError extends Error {
  constructor() {
    super("YouTube not connected");
    this.name = "YouTubeNotConnectedError";
  }
}

export class YouTubeDataError extends Error {
  constructor(message = "Failed to load YouTube data") {
    super(message);
    this.name = "YouTubeDataError";
  }
}
