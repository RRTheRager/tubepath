import type {
  Account,
  GoogleAccount,
  GoogleAccountSummary,
  GoogleCredentials,
  SubscriptionStatus,
  YouTubeChannelLink,
} from "./types";
import { GRACE_DAYS, TRIAL_DAYS } from "./env";
import { getStorage } from "./storage";
import {
  applyGoogleSelection,
  googleAccountSummary,
  toGoogleCredentials,
} from "./storage/types";
import { getAccessToken } from "./data/youtube-client";
import {
  findChannelLink,
  listAccessibleChannels,
  pickDefaultChannel,
} from "./youtube/channels";

// ---------------------------------------------------------------------------
// Account store. Backed by the storage layer (Supabase when configured, else
// in-memory). All functions are async. Time-based subscription transitions are
// reconciled on read to mirror Stripe's automatic behavior.
// ---------------------------------------------------------------------------

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function newAccount(id: string): Account {
  return {
    id,
    email: null,
    name: "Creator",
    status: "none",
    trialEnd: null,
    currentPeriodEnd: null,
    graceEndsAt: null,
    cancelAtPeriodEnd: false,
    youtubeConnected: false,
    streak: 4,
    youtubeChannelId: null,
    youtubeChannels: [],
    activeGoogleAccountId: null,
  };
}

function reconcile(account: Account): boolean {
  const now = Date.now();
  const before = account.status;
  const beforeGrace = account.graceEndsAt ?? null;

  if (account.status === "trialing" && account.trialEnd) {
    if (new Date(account.trialEnd).getTime() <= now) {
      if (account.cancelAtPeriodEnd) {
        account.status = "canceled";
        account.trialEnd = null;
      } else {
        account.status = "active";
        account.trialEnd = null;
        account.currentPeriodEnd = daysFromNow(30);
      }
    }
  }

  if (
    account.status === "active" &&
    account.cancelAtPeriodEnd &&
    account.currentPeriodEnd &&
    new Date(account.currentPeriodEnd).getTime() <= now
  ) {
    account.status = "canceled";
    account.currentPeriodEnd = null;
  }

  if (account.status === "past_due") {
    if (!account.graceEndsAt) {
      account.graceEndsAt = daysFromNow(GRACE_DAYS);
    } else if (new Date(account.graceEndsAt).getTime() <= now) {
      account.status = "canceled";
      account.graceEndsAt = null;
      account.currentPeriodEnd = null;
    }
  } else if (account.graceEndsAt) {
    account.graceEndsAt = null;
  }

  return account.status !== before || (account.graceEndsAt ?? null) !== beforeGrace;
}

export async function getAccount(id: string): Promise<Account> {
  const storage = getStorage();
  let account = await storage.getAccount(id);
  if (!account) {
    account = newAccount(id);
    await storage.saveAccount(account);
  }
  if (reconcile(account)) {
    await storage.saveAccount(account);
  }
  return account;
}

export async function updateAccount(
  id: string,
  patch: Partial<Account>
): Promise<Account> {
  const account = await getAccount(id);
  Object.assign(account, patch);
  await getStorage().saveAccount(account);
  return account;
}

export async function startTrial(id: string): Promise<Account> {
  return updateAccount(id, {
    status: "trialing",
    trialEnd: daysFromNow(TRIAL_DAYS),
    currentPeriodEnd: null,
    graceEndsAt: null,
    cancelAtPeriodEnd: false,
  });
}

export async function cancelSubscription(id: string): Promise<Account> {
  return updateAccount(id, { cancelAtPeriodEnd: true });
}

export async function resumeSubscription(id: string): Promise<Account> {
  return updateAccount(id, { cancelAtPeriodEnd: false });
}

export async function simulateStatus(
  id: string,
  status: SubscriptionStatus,
  opts?: { trialSecondsLeft?: number; graceSecondsLeft?: number }
): Promise<Account> {
  const patch: Partial<Account> = {
    status,
    cancelAtPeriodEnd: false,
    graceEndsAt: null,
  };
  switch (status) {
    case "trialing":
      patch.trialEnd = opts?.trialSecondsLeft
        ? new Date(Date.now() + opts.trialSecondsLeft * 1000).toISOString()
        : daysFromNow(TRIAL_DAYS);
      patch.currentPeriodEnd = null;
      break;
    case "active":
      patch.trialEnd = null;
      patch.currentPeriodEnd = daysFromNow(30);
      break;
    case "past_due":
      patch.currentPeriodEnd = daysFromNow(2);
      patch.graceEndsAt = opts?.graceSecondsLeft
        ? new Date(Date.now() + opts.graceSecondsLeft * 1000).toISOString()
        : daysFromNow(GRACE_DAYS);
      break;
    case "none":
    case "canceled":
      patch.trialEnd = null;
      patch.currentPeriodEnd = null;
      break;
  }
  return updateAccount(id, patch);
}

// ---- Google accounts -------------------------------------------------------

/** Migrate legacy single-row youtube_credentials into google_accounts. */
async function migrateLegacyGoogle(tubepathAccountId: string): Promise<void> {
  const storage = getStorage();
  if (!storage.getLegacyCredentials) return;

  const legacy = await storage.getLegacyCredentials(tubepathAccountId);
  if (!legacy?.refreshToken) return;

  const existing = await storage.listGoogleAccounts(tubepathAccountId);
  if (existing.length > 0) {
    await storage.deleteLegacyCredentials?.(tubepathAccountId);
    return;
  }

  const ga: GoogleAccount = {
    id: newId(),
    tubepathAccountId,
    googleSub: "legacy",
    email: "",
    name: "Google account",
    pictureUrl: "",
    refreshToken: legacy.refreshToken,
    accessToken: legacy.accessToken,
    accessTokenExpiry: legacy.accessTokenExpiry,
    youtubeChannels: [],
    activeChannelId: null,
  };
  await storage.saveGoogleAccount(ga);
  await storage.deleteLegacyCredentials?.(tubepathAccountId);

  const account = await getAccount(tubepathAccountId);
  if (!account.activeGoogleAccountId) {
    await updateAccount(tubepathAccountId, {
      activeGoogleAccountId: ga.id,
      youtubeConnected: true,
    });
  }
}

export async function listGoogleAccounts(
  tubepathAccountId: string
): Promise<GoogleAccount[]> {
  await migrateLegacyGoogle(tubepathAccountId);
  return getStorage().listGoogleAccounts(tubepathAccountId);
}

export async function listGoogleAccountSummaries(
  tubepathAccountId: string
): Promise<GoogleAccountSummary[]> {
  const accounts = await listGoogleAccounts(tubepathAccountId);
  return accounts.map(googleAccountSummary);
}

export async function getActiveGoogleAccount(
  tubepathAccountId: string
): Promise<GoogleAccount | null> {
  await migrateLegacyGoogle(tubepathAccountId);
  const storage = getStorage();
  const account = await getAccount(tubepathAccountId);
  if (account.activeGoogleAccountId) {
    const ga = await storage.getGoogleAccount(account.activeGoogleAccountId);
    if (ga) return ga;
  }
  const all = await storage.listGoogleAccounts(tubepathAccountId);
  return all[0] ?? null;
}

export async function getCredentials(
  tubepathAccountId: string
): Promise<GoogleCredentials | null> {
  const ga = await getActiveGoogleAccount(tubepathAccountId);
  if (!ga?.refreshToken) return null;
  return toGoogleCredentials(ga);
}

export async function saveGoogleAccountTokens(
  creds: GoogleCredentials
): Promise<void> {
  const ga = await getStorage().getGoogleAccount(creds.googleAccountId);
  if (!ga) return;
  ga.accessToken = creds.accessToken;
  ga.accessTokenExpiry = creds.accessTokenExpiry;
  await getStorage().saveGoogleAccount(ga);
}

export interface OAuthGoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/** Upsert a Google login after OAuth and make it active. */
export async function connectGoogleAccount(
  tubepathAccountId: string,
  profile: OAuthGoogleProfile,
  tokens: OAuthTokens
): Promise<{ googleAccount: GoogleAccount; account: Account }> {
  const storage = getStorage();
  let ga =
    (await storage.getGoogleAccountBySub(tubepathAccountId, profile.sub)) ??
    null;

  if (!ga) {
    ga = {
      id: newId(),
      tubepathAccountId,
      googleSub: profile.sub,
      email: profile.email,
      name: profile.name,
      pictureUrl: profile.picture,
      refreshToken: tokens.refresh_token ?? "",
      accessToken: tokens.access_token,
      accessTokenExpiry: Date.now() + tokens.expires_in * 1000,
      youtubeChannels: [],
      activeChannelId: null,
    };
  } else {
    ga.email = profile.email;
    ga.name = profile.name;
    ga.pictureUrl = profile.picture;
    ga.accessToken = tokens.access_token;
    ga.accessTokenExpiry = Date.now() + tokens.expires_in * 1000;
    if (tokens.refresh_token) ga.refreshToken = tokens.refresh_token;
  }

  if (!ga.refreshToken) {
    throw new Error("Google did not return a refresh token; try reconnecting");
  }

  const channels = await listAccessibleChannels(tokens.access_token);
  const defaultChannel = pickDefaultChannel(channels);
  ga.youtubeChannels = channels;
  ga.activeChannelId = defaultChannel?.id ?? null;
  await storage.saveGoogleAccount(ga);

  const account = await updateAccount(
    tubepathAccountId,
    applyGoogleSelection(
      await getAccount(tubepathAccountId),
      ga,
      ga.activeChannelId,
      channels
    )
  );

  return { googleAccount: ga, account };
}

export async function switchGoogleAccount(
  tubepathAccountId: string,
  googleAccountId: string
): Promise<Account> {
  const storage = getStorage();
  const ga = await storage.getGoogleAccount(googleAccountId);
  if (!ga || ga.tubepathAccountId !== tubepathAccountId) {
    throw new Error("Google account not found");
  }

  let channels = ga.youtubeChannels;
  if (!channels.length) {
    const token = await getAccessToken(toGoogleCredentials(ga));
    channels = await listAccessibleChannels(token);
    ga.youtubeChannels = channels;
    await storage.saveGoogleAccount(ga);
  }

  const channelId =
    ga.activeChannelId && findChannelLink(channels, ga.activeChannelId)
      ? ga.activeChannelId
      : pickDefaultChannel(channels)?.id ?? null;

  ga.activeChannelId = channelId;
  await storage.saveGoogleAccount(ga);

  return updateAccount(
    tubepathAccountId,
    applyGoogleSelection(await getAccount(tubepathAccountId), ga, channelId, channels)
  );
}

export async function disconnectGoogleAccount(
  tubepathAccountId: string,
  googleAccountId: string
): Promise<Account> {
  const storage = getStorage();
  const ga = await storage.getGoogleAccount(googleAccountId);
  if (!ga || ga.tubepathAccountId !== tubepathAccountId) {
    throw new Error("Google account not found");
  }
  await storage.deleteGoogleAccount(googleAccountId);

  const remaining = await storage.listGoogleAccounts(tubepathAccountId);
  if (remaining.length === 0) {
    return updateAccount(tubepathAccountId, {
      youtubeConnected: false,
      activeGoogleAccountId: null,
      youtubeChannelId: null,
      youtubeChannels: [],
    });
  }

  const next = remaining[0];
  return switchGoogleAccount(tubepathAccountId, next.id);
}

// ---- YouTube channel selection (scoped to active Google account) -----------

export async function syncYouTubeChannels(tubepathAccountId: string): Promise<{
  channels: YouTubeChannelLink[];
  account: Account;
}> {
  const ga = await getActiveGoogleAccount(tubepathAccountId);
  if (!ga?.refreshToken) throw new Error("YouTube not connected");

  const token = await getAccessToken(toGoogleCredentials(ga));
  const channels = await listAccessibleChannels(token);

  const account = await getAccount(tubepathAccountId);
  const channelId =
    findChannelLink(channels, account.youtubeChannelId ?? "")?.id ??
    findChannelLink(channels, ga.activeChannelId ?? "")?.id ??
    pickDefaultChannel(channels)?.id ??
    null;

  ga.youtubeChannels = channels;
  ga.activeChannelId = channelId;
  await getStorage().saveGoogleAccount(ga);

  const updated = await updateAccount(
    tubepathAccountId,
    applyGoogleSelection(account, ga, channelId, channels)
  );

  return { channels, account: updated };
}

export async function switchYouTubeChannel(
  tubepathAccountId: string,
  channelId: string
): Promise<Account> {
  const account = await getAccount(tubepathAccountId);
  const link = findChannelLink(account.youtubeChannels ?? [], channelId);
  if (!link) throw new Error("Channel not available for this account");

  const ga = await getActiveGoogleAccount(tubepathAccountId);
  if (ga) {
    ga.activeChannelId = channelId;
    await getStorage().saveGoogleAccount(ga);
  }

  return updateAccount(tubepathAccountId, {
    youtubeChannelId: channelId,
    name: link.title,
  });
}
