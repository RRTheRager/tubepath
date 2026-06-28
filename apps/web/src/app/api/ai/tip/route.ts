import { NextResponse } from "next/server";
import { hashContext, isCacheValid } from "@tubepath/core";
import {
  fallbackMetricTip,
  generateMetricTip,
} from "@tubepath/ai";
import { getSession } from "@/lib/session";
import { getTierLimits } from "@/lib/tier";
import { isDemoMode } from "@/lib/env";
import { getDemoSnapshot } from "@/lib/demo-data";

export async function POST(request: Request) {
  const session = await getSession();
  const tier = session?.tier ?? "free";
  const limits = getTierLimits(tier);
  const body = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (tier === "free") {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (supabase && session?.userId) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("tips_count")
        .eq("user_id", session.userId)
        .eq("usage_date", today)
        .single();

      if ((usage?.tips_count ?? 0) >= limits.aiTipsPerDay) {
        return NextResponse.json(
          { error: "Daily AI tip limit reached", tip: fallbackMetricTip(body.metric) },
          { status: 429 }
        );
      }
    }
  }

  const context = {
    metric: body.metric,
    channelSummary: JSON.stringify(getDemoSnapshot()),
    anomaly: body.anomaly ? JSON.stringify(body.anomaly) : undefined,
  };
  const contextHash = hashContext(context);

  if (!isDemoMode() && session?.userId) {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (supabase) {
      const { data: cached } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", session.userId)
        .eq("context_hash", contextHash)
        .eq("insight_type", "metric_tip")
        .single();

      if (cached && isCacheValid(new Date(cached.created_at))) {
        return NextResponse.json({ tip: cached.payload });
      }
    }
  }

  let tip = fallbackMetricTip(body.metric);

  if (apiKey && !isDemoMode()) {
    try {
      tip = await generateMetricTip({ apiKey }, context);
    } catch {
      tip = fallbackMetricTip(body.metric);
    }
  } else if (apiKey) {
    try {
      tip = await generateMetricTip({ apiKey }, context);
    } catch {
      // use fallback
    }
  }

  if (session?.userId && !isDemoMode()) {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    if (supabase) {
      await supabase.from("ai_insights").upsert({
        user_id: session.userId,
        context_hash: contextHash,
        insight_type: "metric_tip",
        payload: tip,
      });

      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("tips_count")
        .eq("user_id", session.userId)
        .eq("usage_date", today)
        .single();

      await supabase.from("ai_usage").upsert({
        user_id: session.userId,
        usage_date: today,
        tips_count: (usage?.tips_count ?? 0) + 1,
        optimize_count: usage?.optimize_count ?? 0,
      });
    }
  }

  return NextResponse.json({ tip });
}
