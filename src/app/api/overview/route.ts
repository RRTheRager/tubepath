import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import {
  canLoadYouTubeData,
  getDataProvider,
  YouTubeDataError,
  YouTubeNotConnectedError,
} from "@/lib/data/provider";
import { fetchStudioAnalytics } from "@/lib/data/studio-analytics";

export async function GET(req: Request) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  const daysParam = new URL(req.url).searchParams.get("days");
  const parsedDays = daysParam ? Number(daysParam) : 28;
  const studioDays = Number.isFinite(parsedDays)
    ? Math.min(Math.max(parsedDays, 7), 90)
    : 28;

  if (!caps.canEnterApp) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  if (!(await canLoadYouTubeData(account))) {
    return NextResponse.json({ youtubeConnected: false });
  }

  try {
    const provider = await getDataProvider(account);
    const overview = await provider.getOverview({
      historyDays: caps.historyDays || 30,
    });

    if (!caps.anomalyDetection) overview.anomalies = [];

    try {
      overview.studio = await fetchStudioAnalytics(account, studioDays);
    } catch {
      /* studio metrics optional if API partial failure */
    }

    return NextResponse.json({ youtubeConnected: true, overview, capabilities: caps });
  } catch (err) {
    if (err instanceof YouTubeNotConnectedError) {
      return NextResponse.json({ youtubeConnected: false });
    }
    if (err instanceof YouTubeDataError) {
      return NextResponse.json(
        { youtubeConnected: true, error: err.message },
        { status: 502 }
      );
    }
    throw err;
  }
}
