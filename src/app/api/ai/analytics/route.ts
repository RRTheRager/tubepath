import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { buildRichAnalyticsContext } from "@/lib/ai/analytics-context";
import { generateAnalyticsBrief } from "@/lib/ai/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);

  if (!caps.canEnterApp) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  if (!caps.ai) {
    return NextResponse.json(
      { error: "Premium required for AI analytics" },
      { status: 403 }
    );
  }

  const ctx = await buildRichAnalyticsContext(account);

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
        facts: ctx.facts,
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
