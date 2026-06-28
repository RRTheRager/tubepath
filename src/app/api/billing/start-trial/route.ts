import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { isStripeConfigured } from "@/lib/env";
import { createCheckoutUrl } from "@/lib/billing";
import { startTrial } from "@/lib/store";

export async function POST() {
  const account = await getCurrentAccount();

  if (isStripeConfigured()) {
    const url = await createCheckoutUrl(account);
    if (url) return NextResponse.json({ url });
  }

  // Simulated billing: begin the 3-day trial immediately.
  await startTrial(account.id);
  return NextResponse.json({ ok: true, simulated: true, redirect: "/app" });
}
