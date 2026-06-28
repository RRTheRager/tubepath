import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { syncYouTubeChannels } from "@/lib/store";

/** List YouTube channels this Google account can access (managers first). */
export async function GET() {
  const account = await getCurrentAccount();
  if (!account.youtubeConnected) {
    return NextResponse.json({ channels: [], activeChannelId: null });
  }

  try {
    const { channels, account: updated } = await syncYouTubeChannels(
      account.id
    );
    return NextResponse.json({
      channels,
      activeChannelId: updated.youtubeChannelId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        channels: account.youtubeChannels ?? [],
        activeChannelId: account.youtubeChannelId,
        error: err instanceof Error ? err.message : "Failed to refresh channels",
      },
      { status: 200 }
    );
  }
}
