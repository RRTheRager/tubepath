import { NextResponse } from "next/server";
import { setActiveChannel } from "@/lib/session";

export async function POST(request: Request) {
  const { channelId } = (await request.json()) as { channelId: string };
  await setActiveChannel(channelId);
  return NextResponse.json({ ok: true });
}
