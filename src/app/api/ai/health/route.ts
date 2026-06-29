import { NextResponse } from "next/server";
import { env, isAiConfigured } from "@/lib/env";
import { geminiPing } from "@/lib/ai/gemini";

/**
 * Diagnostic endpoint: GET /api/ai/health
 * Full key diagnostics are development-only.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: isAiConfigured() });
  }

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

  const models = [...new Set([env.gemini.model, env.gemini.fallbackModel])];
  const results = [];
  for (const m of models) {
    results.push(await geminiPing(m));
  }

  const ok = results.some((r) => r.ok);
  return NextResponse.json({ ok, key: keyInfo, models: results });
}
