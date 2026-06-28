import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { isStripeConfigured } from "@/lib/env";
import { createPortalUrl } from "@/lib/billing";

export async function POST() {
  const account = await getCurrentAccount();

  if (isStripeConfigured() && account.stripeCustomerId) {
    const url = await createPortalUrl(account.stripeCustomerId);
    if (url) return NextResponse.json({ url });
  }

  // Simulated billing has no hosted portal; the Settings page manages state.
  return NextResponse.json({ simulated: true, url: null });
}
