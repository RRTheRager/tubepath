import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { buildRichAnalyticsContext } from "@/lib/ai/analytics-context";
import { generateAnalyticsBrief } from "@/lib/ai/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  const daysParam = new URL(req.url).searchParams.get("days");
  const windowDays = daysParam ? Number(daysParam) : 28;

  if (!caps.canEnterApp) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  if (!caps.ai) {
    return NextResponse.json(
      { error: "Premium required for AI analytics" },
      { status: 403 }
    );
  }

  const ctx = await buildRichAnalyticsContext(account, windowDays);

  if (!ctx.youtubeConnected) {
    return NextResponse.json({ youtubeConnected: false });
  }

  try {
    const { brief, error } = await generateAnalyticsBrief(ctx);
    return NextResponse.json({
      youtubeConnected: true,
      ctx: {
        channelTitle: ctx.channelTitle,
        topic: ctx.topic,
        thinData: ctx.thinData,
        dataDays: ctx.dataDays,
        windowDays: ctx.windowDays,
        facts: ctx.facts,
        comparisons: ctx.comparisons,
        competitors: ctx.competitors,
        dominantPattern: ctx.dominantPattern,
      },
      brief,
      error,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "AI analytics isn't available right now. Please try again or contact support.",
      },
      { status: 502 }
    );
  }
}
