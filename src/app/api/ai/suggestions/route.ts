import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { generateSuggestions } from "@/lib/ai";
import { AI_SUPPORT_MESSAGE } from "@/lib/ai/constants";
import { buildAiContext } from "@/lib/ai/context";

export async function POST(req: Request) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.ai) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const { youtubeConnected } = await buildAiContext(account);
  if (!youtubeConnected) {
    return NextResponse.json({ error: AI_SUPPORT_MESSAGE });
  }

  const body = (await req.json().catch(() => ({}))) as { topic?: string };
  const bundle = await generateSuggestions(body.topic ?? "");
  return NextResponse.json({ bundle });
}
