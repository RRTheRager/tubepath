import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type {
  Account,
  GoogleAccount,
  GoogleCredentials,
  SubscriptionStatus,
  YouTubeChannelLink,
} from "@/lib/types";
import type { Storage } from "./types";

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

function throwIfError(error: PostgrestError | null, op: string): void {
  if (error) throw new Error(`${op}: ${error.message}`);
}

const VALID_STATUSES = new Set<SubscriptionStatus>([
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

function parseStatus(raw: string): SubscriptionStatus {
  return VALID_STATUSES.has(raw as SubscriptionStatus)
    ? (raw as SubscriptionStatus)
    : "none";
}

interface AccountRow {
  id: string;
  email: string | null;
  name: string;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  grace_ends_at: string | null;
  cancel_at_period_end: boolean;
  youtube_connected: boolean;
  streak: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  youtube_channel_id: string | null;
  youtube_channels: YouTubeChannelLink[] | null;
  active_google_account_id: string | null;
}

interface GoogleAccountRow {
  id: string;
  account_id: string;
  google_sub: string;
  email: string;
  name: string;
  picture_url: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expiry: number | null;
  youtube_channels: YouTubeChannelLink[] | null;
  active_channel_id: string | null;
}

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    status: parseStatus(r.status),
    trialEnd: r.trial_end,
    currentPeriodEnd: r.current_period_end,
    graceEndsAt: r.grace_ends_at,
    cancelAtPeriodEnd: r.cancel_at_period_end,
    youtubeConnected: r.youtube_connected,
    streak: r.streak,
    stripeCustomerId: r.stripe_customer_id ?? undefined,
    stripeSubscriptionId: r.stripe_subscription_id ?? undefined,
    youtubeChannelId: r.youtube_channel_id,
    youtubeChannels: (r.youtube_channels as YouTubeChannelLink[] | null) ?? [],
    activeGoogleAccountId: r.active_google_account_id,
  };
}

function accountToRow(a: Account): AccountRow {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    status: a.status,
    trial_end: a.trialEnd,
    current_period_end: a.currentPeriodEnd,
    grace_ends_at: a.graceEndsAt ?? null,
    cancel_at_period_end: a.cancelAtPeriodEnd,
    youtube_connected: a.youtubeConnected,
    streak: a.streak,
    stripe_customer_id: a.stripeCustomerId ?? null,
    stripe_subscription_id: a.stripeSubscriptionId ?? null,
    youtube_channel_id: a.youtubeChannelId ?? null,
    youtube_channels: a.youtubeChannels ?? [],
    active_google_account_id: a.activeGoogleAccountId ?? null,
  };
}

function rowToGoogleAccount(r: GoogleAccountRow): GoogleAccount {
  return {
    id: r.id,
    tubepathAccountId: r.account_id,
    googleSub: r.google_sub,
    email: r.email,
    name: r.name,
    pictureUrl: r.picture_url,
    refreshToken: r.refresh_token,
    accessToken: r.access_token,
    accessTokenExpiry: r.access_token_expiry,
    youtubeChannels: (r.youtube_channels as YouTubeChannelLink[] | null) ?? [],
    activeChannelId: r.active_channel_id,
  };
}

function googleAccountToRow(ga: GoogleAccount): GoogleAccountRow {
  return {
    id: ga.id,
    account_id: ga.tubepathAccountId,
    google_sub: ga.googleSub,
    email: ga.email,
    name: ga.name,
    picture_url: ga.pictureUrl,
    refresh_token: ga.refreshToken,
    access_token: ga.accessToken,
    access_token_expiry: ga.accessTokenExpiry,
    youtube_channels: ga.youtubeChannels,
    active_channel_id: ga.activeChannelId,
  };
}

export class SupabaseStorage implements Storage {
  async getAccount(id: string): Promise<Account | null> {
    const { data, error } = await db()
      .from("accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwIfError(error, "getAccount");
    return data ? rowToAccount(data as AccountRow) : null;
  }

  async saveAccount(account: Account): Promise<void> {
    const { error } = await db().from("accounts").upsert(accountToRow(account));
    throwIfError(error, "saveAccount");
  }

  async listGoogleAccounts(tubepathAccountId: string): Promise<GoogleAccount[]> {
    const { data, error } = await db()
      .from("google_accounts")
      .select("*")
      .eq("account_id", tubepathAccountId);
    throwIfError(error, "listGoogleAccounts");
    return (data ?? []).map((r) => rowToGoogleAccount(r as GoogleAccountRow));
  }

  async getGoogleAccount(id: string): Promise<GoogleAccount | null> {
    const { data, error } = await db()
      .from("google_accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwIfError(error, "getGoogleAccount");
    return data ? rowToGoogleAccount(data as GoogleAccountRow) : null;
  }

  async getGoogleAccountBySub(
    tubepathAccountId: string,
    googleSub: string
  ): Promise<GoogleAccount | null> {
    const { data, error } = await db()
      .from("google_accounts")
      .select("*")
      .eq("account_id", tubepathAccountId)
      .eq("google_sub", googleSub)
      .maybeSingle();
    throwIfError(error, "getGoogleAccountBySub");
    return data ? rowToGoogleAccount(data as GoogleAccountRow) : null;
  }

  async saveGoogleAccount(account: GoogleAccount): Promise<void> {
    const { error } = await db()
      .from("google_accounts")
      .upsert(googleAccountToRow(account));
    throwIfError(error, "saveGoogleAccount");
  }

  async deleteGoogleAccount(id: string): Promise<void> {
    const { error } = await db().from("google_accounts").delete().eq("id", id);
    throwIfError(error, "deleteGoogleAccount");
  }

  async getLegacyCredentials(
    tubepathAccountId: string
  ): Promise<GoogleCredentials | null> {
    const { data, error } = await db()
      .from("youtube_credentials")
      .select("*")
      .eq("account_id", tubepathAccountId)
      .maybeSingle();
    throwIfError(error, "getLegacyCredentials");
    if (!data) return null;
    return {
      googleAccountId: tubepathAccountId,
      tubepathAccountId,
      refreshToken: data.refresh_token,
      accessToken: data.access_token ?? null,
      accessTokenExpiry: data.access_token_expiry ?? null,
    };
  }

  async deleteLegacyCredentials(tubepathAccountId: string): Promise<void> {
    const { error } = await db()
      .from("youtube_credentials")
      .delete()
      .eq("account_id", tubepathAccountId);
    throwIfError(error, "deleteLegacyCredentials");
  }
}
