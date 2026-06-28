import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { buildAiContext } from "@/lib/ai/context";
import { generateInsights } from "@/lib/ai";

export async function GET() {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.ai) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const { ctx } = await buildAiContext(account);
  const insights = await generateInsights(ctx);
  return NextResponse.json({ insights });
}
