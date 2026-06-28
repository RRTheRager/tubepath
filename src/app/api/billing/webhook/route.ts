import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";
import { applyStripeSubscription, getStripe } from "@/lib/billing";

export const dynamic = "force-dynamic";

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
        await applyStripeSubscription(accountId, sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = sub.metadata?.accountId;
      if (accountId) await applyStripeSubscription(accountId, sub);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
