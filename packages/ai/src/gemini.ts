import type {
  DescriptionSuggestion,
  HookSuggestion,
  InsightCard,
  MetricTip,
  TagSuggestion,
  TitleOption,
} from "@tubepath/core";

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface GeminiOptions {
  apiKey: string;
}

async function generateJson<T>(
  opts: GeminiOptions,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const res = await fetch(`${GEMINI_BASE}?key=${opts.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nRespond ONLY with valid JSON, no markdown fences.\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return JSON.parse(text) as T;
}

export async function generateMetricTip(
  opts: GeminiOptions,
  context: {
    metric: string;
    channelSummary: string;
    anomaly?: string;
  }
): Promise<MetricTip> {
  return generateJson<MetricTip>(opts, METRIC_TIP_SYSTEM, JSON.stringify(context));
}

export async function generateInsightCards(
  opts: GeminiOptions,
  context: {
    channelSummary: string;
    metricsSummary: string;
    limit: number;
  }
): Promise<InsightCard[]> {
  const result = await generateJson<{ cards: InsightCard[] }>(
    opts,
    INSIGHT_SYSTEM,
    JSON.stringify(context)
  );
  return (result.cards ?? []).slice(0, context.limit);
}

export async function generateTitleOptions(
  opts: GeminiOptions,
  context: { currentTitle: string; description: string; niche: string }
): Promise<TitleOption[]> {
  const result = await generateJson<{ options: TitleOption[] }>(
    opts,
    OPTIMIZER_SYSTEM,
    `Generate title options: ${JSON.stringify(context)}`
  );
  return result.options ?? [];
}

export async function generateDescription(
  opts: GeminiOptions,
  context: { title: string; tags: string[]; niche: string }
): Promise<DescriptionSuggestion> {
  return generateJson<DescriptionSuggestion>(
    opts,
    OPTIMIZER_SYSTEM,
    `Generate description: ${JSON.stringify(context)}`
  );
}

export async function generateTags(
  opts: GeminiOptions,
  context: { title: string; description: string; niche: string }
): Promise<TagSuggestion[]> {
  const result = await generateJson<{ tags: TagSuggestion[] }>(
    opts,
    OPTIMIZER_SYSTEM,
    `Generate tags: ${JSON.stringify(context)}`
  );
  return result.tags ?? [];
}

export async function generateHook(
  opts: GeminiOptions,
  context: { title: string; description: string }
): Promise<HookSuggestion> {
  return generateJson<HookSuggestion>(
    opts,
    OPTIMIZER_SYSTEM,
    `Generate hook script: ${JSON.stringify(context)}`
  );
}

const METRIC_TIP_SYSTEM = `You are a YouTube growth coach. Given channel metrics context, return JSON:
{ "summary": "one sentence", "causes": ["..."], "actions": ["..."], "priority": "high"|"medium"|"low" }
Focus on engagement (likes + comments per view). Be specific and actionable.`;

const INSIGHT_SYSTEM = `You are a YouTube analytics coach. Return JSON:
{ "cards": [{ "id": "uuid", "type": "engagement"|"views"|"general", "summary": "one liner", "detail": "optional", "actions": ["..."], "priority": "high"|"medium"|"low" }] }
Prioritize engagement insights first. Keep summaries punchy and addictive to read.`;

const OPTIMIZER_SYSTEM = `You are a YouTube SEO expert. Return structured JSON matching the requested schema.
Optimize for click-through and engagement. Use proven patterns without clickbait.`;

export function fallbackInsightCards(): InsightCard[] {
  return [
    {
      id: "fallback-1",
      type: "engagement",
      summary: "Ask a question in your first 10 seconds to boost comments.",
      priority: "high",
    },
    {
      id: "fallback-2",
      type: "views",
      summary: "Your thumbnail text should be readable at mobile size.",
      priority: "medium",
    },
    {
      id: "fallback-3",
      type: "general",
      summary: "Pin a comment with a call-to-action on your latest upload.",
      priority: "medium",
    },
  ];
}

export function fallbackMetricTip(metric: string): MetricTip {
  return {
    summary: `Focus on improving ${metric} by engaging viewers in the first 30 seconds.`,
    causes: ["Hook may not match thumbnail promise", "Audience retention drop early"],
    actions: [
      "Add a pattern interrupt in the opening",
      "End with a question to drive comments",
      "Reply to comments within the first hour",
    ],
    priority: "high",
  };
}
