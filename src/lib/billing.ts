import Stripe from "stripe";
import { env, GRACE_DAYS, isStripeConfigured, TRIAL_DAYS } from "./env";
import { updateAccount } from "./store";
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
    // Sync subscription on return — don't rely on the webhook alone (it can lag).
    success_url: `${env.appUrl}/api/billing/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
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

/** Apply Stripe subscription fields to the TubePath account record. */
export async function applyStripeSubscription(
  accountId: string,
  sub: Stripe.Subscription
): Promise<void> {
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
  if (status === "past_due") {
    patch.graceEndsAt = new Date(
      Date.now() + GRACE_DAYS * 86_400_000
    ).toISOString();
  } else {
    patch.graceEndsAt = null;
  }
  await updateAccount(accountId, patch);
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
