import Stripe from "stripe";
import { getAppUrl } from "./env";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export async function createCheckoutSession(
  customerId: string | null,
  userId: string,
  email: string
) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!stripe || !priceId) {
    return { url: null, demo: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId ?? undefined,
    customer_email: customerId ? undefined : email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/settings?upgraded=1`,
    cancel_url: `${getAppUrl()}/settings`,
    metadata: { userId },
  });

  return { url: session.url, demo: false };
}

export async function createBillingPortal(customerId: string) {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/settings`,
  });

  return session.url;
}
