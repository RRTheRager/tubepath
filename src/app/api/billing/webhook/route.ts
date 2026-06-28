import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";
import { getStripe, mapStripeStatus } from "@/lib/billing";
import { updateAccount } from "@/lib/store";
import type { Account } from "@/lib/types";

export const dynamic = "force-dynamic";

async function applySubscription(accountId: string, sub: Stripe.Subscription) {
  const status = mapStripeStatus(sub.status);
  const patch: Partial<Account> = {
    status,
    stripeSubscriptionId: sub.id,
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEnd: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
  };
  // Leave grace deadline untouched while past_due (reconcile initializes it on
  // first sight); clear it as soon as the subscription leaves past_due.
  if (status !== "past_due") patch.graceEndsAt = null;
  await updateAccount(accountId, patch);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig ?? "",
      env.stripe.webhookSecret
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId =
        session.client_reference_id ?? session.metadata?.accountId;
      if (accountId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await applySubscription(accountId, sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = sub.metadata?.accountId;
      if (accountId) await applySubscription(accountId, sub);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
