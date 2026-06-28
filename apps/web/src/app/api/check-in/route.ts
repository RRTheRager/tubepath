import { NextResponse } from "next/server";
import { getSession, recordCheckIn } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (session?.userId) {
    await recordCheckIn(session.userId);
  }
  return NextResponse.json({ ok: true });
}
