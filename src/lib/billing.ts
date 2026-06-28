import Stripe from "stripe";
import { env, isStripeConfigured, TRIAL_DAYS } from "./env";
import type { Account, SubscriptionStatus } from "./types";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    // Omit apiVersion to use the version pinned by the installed SDK,
    // avoiding type mismatches across Stripe SDK upgrades.
    stripeClient = new Stripe(env.stripe.secretKey);
  }
  return stripeClient;
}

/**
 * Create a Checkout session for the single premium plan with a 3-day,
 * card-required free trial that auto-converts. Returns the redirect URL.
 */
export async function createCheckoutUrl(
  account: Account
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.stripe.priceId, quantity: 1 }],
    payment_method_collection: "always", // card required up front
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      trial_settings: {
        end_behavior: { missing_payment_method: "cancel" },
      },
      metadata: { accountId: account.id },
    },
    client_reference_id: account.id,
    customer_email: account.email ?? undefined,
    success_url: `${env.appUrl}/app?welcome=1`,
    cancel_url: `${env.appUrl}/?canceled=1`,
    metadata: { accountId: account.id },
  });

  return session.url;
}

export async function createPortalUrl(
  customerId: string
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.appUrl}/app/settings`,
  });
  return portal.url;
}

/** Map a Stripe subscription status to our internal status. */
export function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}
