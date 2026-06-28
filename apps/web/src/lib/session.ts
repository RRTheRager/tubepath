import { cookies } from "next/headers";
import type { SubscriptionTier } from "@tubepath/core";
import { isDemoMode } from "./env";
import { getDemoSession, DEMO_CHANNELS } from "./demo-data";

const TIER_COOKIE = "tubepath_tier";
const CHANNEL_COOKIE = "tubepath_channel";

export async function getSession() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const tier = (cookieStore.get(TIER_COOKIE)?.value as SubscriptionTier) ?? "free";
    const activeChannelId =
      cookieStore.get(CHANNEL_COOKIE)?.value ?? DEMO_CHANNELS[0]!.id;
    const demo = getDemoSession(tier);
    return {
      ...demo,
      tier,
      activeChannelId,
      channels: DEMO_CHANNELS,
      demo: true,
    };
  }

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  if (!supabase) {
    return getDemoSession("free");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: channels } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("user_id", user.id);

  return {
    userId: user.id,
    email: user.email ?? "",
    tier: (profile?.tier as SubscriptionTier) ?? "free",
    activeChannelId: profile?.active_channel_id ?? channels?.[0]?.id,
    channels: (channels ?? []).map((c) => ({
      id: c.id,
      youtubeChannelId: c.youtube_channel_id,
      title: c.title,
      thumbnailUrl: c.thumbnail_url ?? "",
      role: c.role,
      subscriberCount: Number(c.subscriber_count ?? 0),
    })),
  };
}

export async function setDemoTier(tier: SubscriptionTier) {
  const cookieStore = await cookies();
  cookieStore.set(TIER_COOKIE, tier, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setActiveChannel(channelId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CHANNEL_COOKIE, channelId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function recordCheckIn(userId: string) {
  if (isDemoMode()) return;
  const { createServiceClient } = await import("./supabase/server");
  const supabase = createServiceClient();
  if (!supabase) return;

  const today = new Date().toISOString().slice(0, 10);
  const { data: profile } = await supabase
    .from("profiles")
    .select("check_in_dates")
    .eq("id", userId)
    .single();

  const dates: string[] = profile?.check_in_dates ?? [];
  if (!dates.includes(today)) {
    await supabase
      .from("profiles")
      .update({ check_in_dates: [...dates, today] })
      .eq("id", userId);
  }
}

export async function getStreak(userId: string): Promise<number> {
  if (isDemoMode()) return 5;

  const { createServiceClient } = await import("./supabase/server");
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("check_in_dates")
    .eq("id", userId)
    .single();

  const { getStreakDays } = await import("@tubepath/core");
  return getStreakDays((profile?.check_in_dates ?? []) as string[]);
}
