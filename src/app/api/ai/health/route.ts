import { NextResponse } from "next/server";
import { env, isAiConfigured } from "@/lib/env";
import { geminiPing } from "@/lib/ai/gemini";

/**
 * Diagnostic endpoint: GET /api/ai/health
 * Reports the detected key (masked) and tests each configured model directly so
 * 429s, retry delays, and which model still has quota are all visible.
 */
export async function GET() {
  const key = env.gemini.apiKey;
  const keyInfo = {
    present: key.length > 0,
    length: key.length,
    prefix: key ? key.slice(0, 3) : null,
    last4: key ? key.slice(-4) : null,
    format: key.startsWith("AQ.")
      ? "auth-key (new)"
      : key.startsWith("AIza")
        ? "standard-key (legacy)"
        : key
          ? "unknown"
          : "none",
  };

  if (!isAiConfigured()) {
    return NextResponse.json({
      ok: false,
      reason: "GEMINI_API_KEY not set",
      key: keyInfo,
    });
  }

  // Test the primary and fallback models (deduped) one after another.
  const models = [...new Set([env.gemini.model, env.gemini.fallbackModel])];
  const results = [];
  for (const m of models) {
    results.push(await geminiPing(m));
  }

  const ok = results.some((r) => r.ok);
  return NextResponse.json({ ok, key: keyInfo, models: results });
}
