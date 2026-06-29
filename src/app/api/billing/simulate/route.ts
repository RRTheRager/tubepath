import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { isDevBillingAllowed, isStripeConfigured } from "@/lib/env";
import { simulateStatus } from "@/lib/store";
import type { SubscriptionStatus } from "@/lib/types";

const VALID: SubscriptionStatus[] = [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
];

/** Dev-only billing simulator (disabled when real Stripe is configured). */
export async function POST(req: Request) {
  if (isStripeConfigured()) {
    return NextResponse.json(
      { error: "Simulator disabled: real Stripe is configured." },
      { status: 400 }
    );
  }

  if (!isDevBillingAllowed()) {
    return NextResponse.json(
      { error: "Billing simulator is disabled in production." },
      { status: 403 }
    );
  }

  const account = await getCurrentAccount();
  const body = (await req.json().catch(() => ({}))) as {
    status?: SubscriptionStatus;
    trialSecondsLeft?: number;
  };

  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await simulateStatus(account.id, body.status, {
    trialSecondsLeft: body.trialSecondsLeft,
  });
  return NextResponse.json({ ok: true, account: updated });
}
