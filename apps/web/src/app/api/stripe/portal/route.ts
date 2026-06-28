import { NextResponse } from "next/server";
import { createBillingPortal } from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/env";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ url: null, demo: true });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    ?.from("profiles")
    .select("stripe_customer_id")
    .eq("id", session.userId)
    .single() ?? { data: null };

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription" }, { status: 400 });
  }

  const url = await createBillingPortal(profile.stripe_customer_id);
  return NextResponse.json({ url });
}
