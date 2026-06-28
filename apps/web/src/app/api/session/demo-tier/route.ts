import { NextResponse } from "next/server";
import type { SubscriptionTier } from "@tubepath/core";
import { setDemoTier } from "@/lib/session";
import { isDemoMode } from "@/lib/env";

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Only available in demo mode" }, { status: 403 });
  }
  const { tier } = (await request.json()) as { tier: SubscriptionTier };
  await setDemoTier(tier);
  return NextResponse.json({ tier });
}
