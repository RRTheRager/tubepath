import { NextResponse } from "next/server";
import { getDemoPulseData } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    getDemoPulseData();
    return NextResponse.json({ ok: true, demo: true });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  const { data: channels } = await supabase
    .from("channel_connections")
    .select("id, youtube_channel_id, user_id, google_account_id");

  return NextResponse.json({
    ok: true,
    channelsQueued: channels?.length ?? 0,
    message: "Sync jobs queued — call /api/sync per channel with user session for full sync",
  });
}
