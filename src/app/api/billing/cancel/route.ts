import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { isStripeConfigured } from "@/lib/env";
import { getStripe } from "@/lib/billing";
import { cancelSubscription } from "@/lib/store";

export async function POST() {
  const account = await getCurrentAccount();

  if (isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe && account.stripeSubscriptionId) {
      await stripe.subscriptions.update(account.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return NextResponse.json({ ok: true });
    }
  }

  await cancelSubscription(account.id);
  return NextResponse.json({ ok: true, simulated: true });
}
