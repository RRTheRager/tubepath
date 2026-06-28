import type {
  Account,
  GoogleAccount,
  GoogleCredentials,
  YouTubeChannelLink,
} from "@/lib/types";

/**
 * Persistence boundary for TubePath accounts + connected Google logins.
 */
export interface Storage {
  getAccount(id: string): Promise<Account | null>;
  saveAccount(account: Account): Promise<void>;

  listGoogleAccounts(tubepathAccountId: string): Promise<GoogleAccount[]>;
  getGoogleAccount(id: string): Promise<GoogleAccount | null>;
  getGoogleAccountBySub(
    tubepathAccountId: string,
    googleSub: string
  ): Promise<GoogleAccount | null>;
  saveGoogleAccount(account: GoogleAccount): Promise<void>;
  deleteGoogleAccount(id: string): Promise<void>;

  /** Legacy single-row credentials (Supabase migration source). */
  getLegacyCredentials?(tubepathAccountId: string): Promise<GoogleCredentials | null>;
  deleteLegacyCredentials?(tubepathAccountId: string): Promise<void>;
}

export function toGoogleCredentials(ga: GoogleAccount): GoogleCredentials {
  return {
    googleAccountId: ga.id,
    tubepathAccountId: ga.tubepathAccountId,
    refreshToken: ga.refreshToken,
    accessToken: ga.accessToken,
    accessTokenExpiry: ga.accessTokenExpiry,
  };
}

export function googleAccountSummary(ga: GoogleAccount) {
  return {
    id: ga.id,
    email: ga.email,
    name: ga.name,
    pictureUrl: ga.pictureUrl,
    channelCount: ga.youtubeChannels.length,
  };
}

export function applyGoogleSelection(
  tubepath: Account,
  ga: GoogleAccount,
  channelId: string | null,
  channels: YouTubeChannelLink[]
): Partial<Account> {
  const activeChannel =
    channels.find((c) => c.id === channelId) ??
    channels.find((c) => c.role === "manager") ??
    channels[0];
  return {
    activeGoogleAccountId: ga.id,
    youtubeConnected: true,
    youtubeChannels: channels,
    youtubeChannelId: activeChannel?.id ?? null,
    ...(activeChannel ? { name: activeChannel.title } : {}),
  };
}
