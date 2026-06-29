import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { isStripeConfigured } from "@/lib/env";
import { applyStripeSubscription, createPortalUrl, getStripe } from "@/lib/billing";
import { simulateStatus } from "@/lib/store";

/** End the trial early and convert to paid premium. */
export async function POST() {
  const account = await getCurrentAccount();

  if (isStripeConfigured()) {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
    }

    if (account.status === "past_due" && account.stripeCustomerId) {
      const url = await createPortalUrl(account.stripeCustomerId);
      if (url) return NextResponse.json({ url });
      return NextResponse.json(
        { error: "Could not open billing portal" },
        { status: 502 }
      );
    }

    if (account.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.update(
          account.stripeSubscriptionId,
          { trial_end: "now" }
        );
        await applyStripeSubscription(account.id, sub);
        return NextResponse.json({ ok: true });
      } catch {
        if (account.stripeCustomerId) {
          const url = await createPortalUrl(account.stripeCustomerId);
          if (url) return NextResponse.json({ url });
        }
        return NextResponse.json(
          { error: "Could not activate subscription" },
          { status: 502 }
        );
      }
    }

    if (account.stripeCustomerId) {
      const url = await createPortalUrl(account.stripeCustomerId);
      if (url) return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  // Simulated billing: flip straight to active.
  await simulateStatus(account.id, "active");
  return NextResponse.json({ ok: true, simulated: true });
}
