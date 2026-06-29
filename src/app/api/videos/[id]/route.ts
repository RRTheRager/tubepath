import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import {
  canLoadYouTubeData,
  getDataProvider,
  YouTubeDataError,
  YouTubeNotConnectedError,
} from "@/lib/data/provider";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.canEnterApp) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  if (!(await canLoadYouTubeData(account))) {
    return NextResponse.json({ youtubeConnected: false }, { status: 403 });
  }

  try {
    const provider = await getDataProvider(account);
    const video = await provider.getVideo(id);
    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ youtubeConnected: true, video, deepDive: caps.videoDeepDive });
  } catch (err) {
    if (err instanceof YouTubeNotConnectedError) {
      return NextResponse.json({ youtubeConnected: false }, { status: 403 });
    }
    if (err instanceof YouTubeDataError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }
}
