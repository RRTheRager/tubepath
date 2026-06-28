import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { generateSuggestions } from "@/lib/ai";

export async function POST(req: Request) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.ai) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { topic?: string };
  const bundle = await generateSuggestions(body.topic ?? "");
  return NextResponse.json({ bundle });
}
