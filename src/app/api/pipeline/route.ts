import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { canLoadYouTubeData } from "@/lib/data/provider";
import { buildPipeline } from "@/lib/pipeline/build";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);

  if (!caps.canEnterApp) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  if (!(await canLoadYouTubeData(account))) {
    return NextResponse.json({ youtubeConnected: false });
  }

  try {
    const isFull = caps.level === "full";
    const pipeline = await buildPipeline(account, { teaser: !isFull });

    return NextResponse.json({
      youtubeConnected: true,
      pipeline,
      isFull,
      competitorsEnabled: caps.competitors,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Pipeline unavailable";
    return NextResponse.json(
      {
        error:
          "We couldn't build your topic pipeline right now. Please try again later or contact support.",
        detail: message,
      },
      { status: 502 }
    );
  }
}
