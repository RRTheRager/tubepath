import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { switchYouTubeChannel } from "@/lib/store";

export async function POST(req: Request) {
  const account = await getCurrentAccount();
  if (!account.youtubeConnected) {
    return NextResponse.json({ error: "YouTube not connected" }, { status: 400 });
  }

  const body = (await req.json()) as { channelId?: string };
  if (!body.channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 });
  }

  try {
    const updated = await switchYouTubeChannel(account.id, body.channelId);
    return NextResponse.json({
      ok: true,
      account: updated,
      activeChannelId: updated.youtubeChannelId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Switch failed" },
      { status: 400 }
    );
  }
}
