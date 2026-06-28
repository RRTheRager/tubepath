import { NextResponse } from "next/server";
import { getDemoVideos } from "@/lib/demo-data";
import { getSession } from "@/lib/session";
import { syncVideos } from "@/lib/sync";
import { isDemoMode } from "@/lib/env";

export async function GET() {
  const session = await getSession();
  const tier = session?.tier ?? "free";

  if (isDemoMode() || !session?.activeChannelId) {
    return NextResponse.json({ videos: getDemoVideos(), tier });
  }

  const channel = session.channels.find((c) => c.id === session.activeChannelId);
  if (!channel) {
    return NextResponse.json({ videos: getDemoVideos(), tier });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const { data: googleAccount } = await supabase
    ?.from("google_accounts")
    .select("access_token")
    .eq("user_id", session.userId)
    .single() ?? { data: null };

  if (googleAccount?.access_token) {
    const videos = await syncVideos(
      googleAccount.access_token,
      channel.youtubeChannelId
    );
    return NextResponse.json({ videos, tier });
  }

  return NextResponse.json({ videos: getDemoVideos(), tier });
}
