import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";
import { applyStripeSubscription, getStripe } from "@/lib/billing";
import { getCurrentAccount, setSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

function redirect(path: string) {
  return NextResponse.redirect(`${env.appUrl}${path}`);
}

export async function GET(req: Request) {
  if (!isStripeConfigured()) return redirect("/");

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return redirect("/?error=checkout");

  const stripe = getStripe();
  if (!stripe) return redirect("/");

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.status !== "complete") return redirect("/?error=checkout");

    const accountId =
      session.client_reference_id ?? session.metadata?.accountId;
    if (!accountId) return redirect("/?error=checkout");

    let sub: Stripe.Subscription | null = null;
    if (typeof session.subscription === "string") {
      sub = await stripe.subscriptions.retrieve(session.subscription);
    } else if (session.subscription) {
      sub = session.subscription as Stripe.Subscription;
    }
    if (!sub) return redirect("/?error=checkout");

    await applyStripeSubscription(accountId, sub);

    // Checkout was started under a different browser session — align the cookie.
    const account = await getCurrentAccount();
    if (account.id !== accountId) await setSessionId(accountId);
  } catch {
    return redirect("/?error=checkout");
  }

  return redirect("/app?welcome=1");
}
