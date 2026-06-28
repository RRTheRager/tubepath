import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { buildAiContext } from "@/lib/ai/context";
import { chat } from "@/lib/ai";

export async function POST(req: Request) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.ai) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { message?: string };
  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const { ctx, videos } = await buildAiContext(account);
  const result = await chat(message, ctx, videos);
  return NextResponse.json(result);
}
