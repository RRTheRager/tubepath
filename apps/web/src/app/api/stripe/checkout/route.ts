import { NextResponse } from "next/server";
import { createCheckoutSession, createBillingPortal } from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/env";
import { setDemoTier } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    await setDemoTier("pro");
    return NextResponse.json({ url: null, demo: true });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    ?.from("profiles")
    .select("stripe_customer_id")
    .eq("id", session.userId)
    .single() ?? { data: null };

  const result = await createCheckoutSession(
    profile?.stripe_customer_id ?? null,
    session.userId,
    session.email
  );

  return NextResponse.json(result);
}
