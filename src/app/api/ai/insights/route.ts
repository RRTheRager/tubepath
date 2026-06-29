import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { buildAiContext } from "@/lib/ai/context";
import { generateInsights } from "@/lib/ai";
import { AI_SUPPORT_MESSAGE } from "@/lib/ai/constants";

export async function GET() {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.ai) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const { ctx, youtubeConnected } = await buildAiContext(account);
  if (!youtubeConnected) {
    return NextResponse.json({ insights: [], error: AI_SUPPORT_MESSAGE });
  }

  const { insights, error } = await generateInsights(ctx);
  return NextResponse.json({ insights, error });
}
