import { env } from "@/lib/env";

const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

async function callModel(model: string, body: unknown): Promise<string> {
  const res = await fetch(geminiUrl(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.gemini.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[gemini:${model}] ${res.status} ${res.statusText}: ${detail}`);
    const err = new Error(`Gemini error ${res.status}: ${detail.slice(0, 300)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text.trim();
}

/**
 * Low-level call. Passes the API key via the `x-goog-api-key` header, which is
 * the method Google recommends and the only one that works reliably for the
 * newer `AQ.`-prefixed auth keys (the query-param `?key=` form can fail).
 *
 * On a 429 (quota) or 503 (overloaded) it retries once with the fallback model,
 * which has its own separate free-tier quota bucket.
 */
async function callGemini(body: unknown): Promise<string> {
  if (!env.gemini.apiKey) throw new Error("GEMINI_API_KEY is not set");

  try {
    return await callModel(env.gemini.model, body);
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    const canFallback =
      (status === 429 || status === 503) &&
      env.gemini.fallbackModel &&
      env.gemini.fallbackModel !== env.gemini.model;
    if (!canFallback) throw err;
    console.warn(
      `[gemini] ${env.gemini.model} hit ${status}; retrying with ${env.gemini.fallbackModel}`
    );
    return callModel(env.gemini.fallbackModel, body);
  }
}

export interface GeminiPing {
  model: string;
  ok: boolean;
  status?: number;
  sample?: string;
  detail?: string;
  retryAfter?: string;
}

/** Diagnostic: minimal call to a specific model, returns structured result. */
export async function geminiPing(model: string): Promise<GeminiPing> {
  if (!env.gemini.apiKey) return { model, ok: false, detail: "no API key" };
  try {
    const res = await fetch(geminiUrl(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.gemini.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say OK." }] }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const retry = /"retryDelay":\s*"([^"]+)"/.exec(detail)?.[1];
      return { model, ok: false, status: res.status, detail, retryAfter: retry };
    }
    const data = (await res.json()) as GeminiResponse;
    const sample = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return { model, ok: true, sample: sample ?? "(empty)" };
  } catch (e) {
    return { model, ok: false, detail: String(e) };
  }
}

export async function geminiText(
  systemPrompt: string,
  userPrompt: string,
  opts?: { temperature?: number }
): Promise<string> {
  return callGemini({
    contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    generationConfig: { temperature: opts?.temperature ?? 0.7 },
  });
}

export async function geminiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: { temperature?: number }
): Promise<T> {
  const text = await callGemini({
    contents: [
      {
        parts: [
          {
            text: `${systemPrompt}\n\nRespond ONLY with valid minified JSON, no markdown fences.\n\n${userPrompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: opts?.temperature ?? 0.7,
      responseMimeType: "application/json",
    },
  });
  return JSON.parse(text) as T;
}
