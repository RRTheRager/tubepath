import { NextResponse } from "next/server";
import { getCurrentAccount, getSessionId } from "@/lib/session";
import { isStripeConfigured } from "@/lib/env";
import { createCheckoutUrl } from "@/lib/billing";
import { startTrial } from "@/lib/store";

export async function POST() {
  // Ensure the session cookie is persisted before redirecting to Stripe.
  await getSessionId();
  const account = await getCurrentAccount();

  if (isStripeConfigured()) {
    const url = await createCheckoutUrl(account);
    if (url) return NextResponse.json({ url });
  }

  // Simulated billing: begin the 3-day trial immediately.
  await startTrial(account.id);
  return NextResponse.json({ ok: true, simulated: true, redirect: "/app" });
}
