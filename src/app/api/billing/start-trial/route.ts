import { NextResponse } from "next/server";
import { getCurrentAccount, getSessionId, setCheckoutIntent } from "@/lib/session";
import { isDevBillingAllowed, isStripeConfigured } from "@/lib/env";
import { createCheckoutUrl } from "@/lib/billing";
import { startTrial } from "@/lib/store";

export async function POST() {
  await getSessionId();
  const account = await getCurrentAccount();

  if (isStripeConfigured()) {
    const url = await createCheckoutUrl(account);
    if (url) {
      await setCheckoutIntent(account.id);
      return NextResponse.json({ url });
    }
  }

  if (!isDevBillingAllowed()) {
    return NextResponse.json(
      { error: "Billing is not configured for this environment." },
      { status: 503 }
    );
  }

  await startTrial(account.id);
  return NextResponse.json({ ok: true, simulated: true, redirect: "/app" });
}
