import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { isStripeConfigured } from "@/lib/env";
import { getStripe, createPortalUrl } from "@/lib/billing";
import { simulateStatus } from "@/lib/store";

/** End the trial early and convert to paid premium. */
export async function POST() {
  const account = await getCurrentAccount();

  if (isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe && account.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(account.stripeSubscriptionId, {
          trial_end: "now",
        });
        return NextResponse.json({ ok: true });
      } catch {
        /* fall through to portal */
      }
    }
    if (account.stripeCustomerId) {
      const url = await createPortalUrl(account.stripeCustomerId);
      if (url) return NextResponse.json({ url });
    }
  }

  // Simulated billing: flip straight to active.
  await simulateStatus(account.id, "active");
  return NextResponse.json({ ok: true, simulated: true });
}
