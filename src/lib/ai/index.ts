import { isAiConfigured } from "@/lib/env";
import type {
  ChatToolCall,
  InsightCard,
  SuggestionBundle,
  VideoSummary,
} from "@/lib/types";
import { geminiJson, geminiText } from "./gemini";
import {
  fallbackChat,
  fallbackInsights,
  fallbackSuggestions,
  AI_SUPPORT_MESSAGE,
} from "./fallback";

export interface AiChannelContext {
  channelTitle: string;
  viewsChange: number;
  engagementChange: number;
  topVideoTitle: string;
}

// ---- Lightweight TTL cache ------------------------------------------------
// Repeated visits to the feed / studio shouldn't burn Gemini quota. Cache
// results in-process for a short window keyed by the request inputs.

const g = globalThis as unknown as {
  __tubepathAiCache?: Map<string, { value: unknown; expires: number }>;
};
const aiCache: Map<string, { value: unknown; expires: number }> =
  g.__tubepathAiCache ?? (g.__tubepathAiCache = new Map());

async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = aiCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await fn();
  aiCache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

// ---- Suggestions ----------------------------------------------------------

export async function generateSuggestions(
  topic: string
): Promise<SuggestionBundle & { error?: string }> {
  if (!isAiConfigured()) {
    return { ...fallbackSuggestions(), error: AI_SUPPORT_MESSAGE };
  }
  try {
    // Cache for 1h so re-opening the studio for the same topic is free.
    return await cached(`suggest:${topic}`, 3_600_000, async () => {
      const system =
        "You are a world-class YouTube strategist. Return JSON with keys: titles (array of {text,rationale,ctrScore 0-100}), description ({hook,body,cta,hashtags[]}), tags (array of {tag,relevance 0-100,competition low|medium|high}), hook ({script,retentionTactics[]}), tips (array of {id,title,body,priority high|medium|low,category engagement|discovery|retention|consistency}).";
      const bundle = await geminiJson<Omit<SuggestionBundle, "ai">>(
        system,
        `Video topic: ${topic || "a new video for a growing channel"}`
      );
      return { ...bundle, ai: true };
    });
  } catch {
    return { ...fallbackSuggestions(), error: AI_SUPPORT_MESSAGE };
  }
}

// ---- Insights -------------------------------------------------------------

export async function generateInsights(
  ctx: AiChannelContext
): Promise<{ insights: InsightCard[]; error?: string }> {
  if (!isAiConfigured()) {
    return { insights: fallbackInsights(), error: AI_SUPPORT_MESSAGE };
  }
  try {
    // Cache for 10m so refreshing/revisiting the feed doesn't re-call Gemini.
    const insights = await cached(`insights:${JSON.stringify(ctx)}`, 600_000, async () => {
      const system =
        'You are a YouTube analytics coach. Return JSON {"cards":[{"id","tone":"positive|neutral|negative|tip","emoji","headline","detail","deltaLabel?"}]}. Keep headlines punchy and addictive. Max 4 cards.';
      const result = await geminiJson<{ cards: Omit<InsightCard, "ai">[] }>(
        system,
        JSON.stringify(ctx)
      );
      return (result.cards ?? []).map((c) => ({ ...c, ai: true }));
    });
    return { insights };
  } catch {
    return { insights: fallbackInsights(), error: AI_SUPPORT_MESSAGE };
  }
}

// ---- Chat with tool-calling actions --------------------------------------

interface DetectedAction {
  kind: "title" | "description" | "tags";
}

function detectActionIntent(message: string): DetectedAction | null {
  const m = message.toLowerCase();
  const wantsChange =
    /\b(rewrite|change|update|improve|fix|optimi[sz]e|new|better|generate|write|make)\b/.test(
      m
    );
  if (!wantsChange) return null;
  if (m.includes("title")) return { kind: "title" };
  if (m.includes("description") || m.includes("desc")) return { kind: "description" };
  if (m.includes("tag")) return { kind: "tags" };
  return null;
}

async function craftValue(
  kind: DetectedAction["kind"],
  video: VideoSummary
): Promise<{ value: string | string[]; preview: string }> {
  if (kind === "title") {
    let title = video.title;
    if (isAiConfigured()) {
      try {
        title = (
          await geminiText(
            "You are a YouTube title expert. Return ONLY the single best new title, no quotes.",
            `Rewrite this title for higher CTR without clickbait: "${video.title}"`
          )
        )
          .replace(/^["']|["']$/g, "")
          .slice(0, 100);
      } catch {
        return { value: title, preview: AI_SUPPORT_MESSAGE };
      }
    } else {
      return { value: title, preview: AI_SUPPORT_MESSAGE };
    }
    return { value: title, preview: title };
  }

  if (kind === "description") {
    if (!isAiConfigured()) {
      return { value: "", preview: AI_SUPPORT_MESSAGE };
    }
    try {
      const desc = await geminiText(
        "You are a YouTube SEO copywriter. Write a compelling description with a hook, body, CTA, and timestamps.",
        `Write a description for the video titled: "${video.title}"`
      );
      return { value: desc, preview: desc.slice(0, 160) + "..." };
    } catch {
      return { value: "", preview: AI_SUPPORT_MESSAGE };
    }
  }

  // tags
  if (!isAiConfigured()) {
    return { value: [], preview: AI_SUPPORT_MESSAGE };
  }
  try {
    const parsed = await geminiJson<{ tags: string[] }>(
      'Return JSON {"tags": string[]} with 8 high-intent YouTube tags.',
      `Tags for the video titled: "${video.title}"`
    );
    const tags =
      Array.isArray(parsed.tags) && parsed.tags.length
        ? parsed.tags
        : [];
    if (!tags.length) return { value: [], preview: AI_SUPPORT_MESSAGE };
    return { value: tags, preview: tags.join(", ") };
  } catch {
    return { value: [], preview: AI_SUPPORT_MESSAGE };
  }
}

export interface ChatResult {
  content: string;
  pendingAction?: ChatToolCall;
}

export async function chat(
  message: string,
  ctx: AiChannelContext,
  videos: VideoSummary[]
): Promise<ChatResult> {
  const intent = detectActionIntent(message);

  if (intent && videos.length) {
    // Target the most recently published video by default.
    const target = videos[0];
    const { value, preview } = await craftValue(intent.kind, target);

    if (preview === AI_SUPPORT_MESSAGE) {
      return { content: AI_SUPPORT_MESSAGE };
    }

    const nameMap = {
      title: "update_title",
      description: "update_description",
      tags: "update_tags",
    } as const;

    const argKey =
      intent.kind === "title"
        ? "title"
        : intent.kind === "description"
          ? "description"
          : "tags";

    const label =
      intent.kind === "tags"
        ? `Set ${(value as string[]).length} tags on "${target.title}"`
        : intent.kind === "title"
          ? `Rename "${target.title}" -> "${value as string}"`
          : `Replace the description on "${target.title}"`;

    return {
      content:
        intent.kind === "tags"
          ? `Here are tags I'd set for "${target.title}":\n\n${preview}\n\nWant me to apply them?`
          : intent.kind === "title"
            ? `Proposed new title for "${target.title}":\n\n"${value as string}"\n\nApply it?`
            : `Here's a fresh description for "${target.title}":\n\n${preview}\n\nApply it?`,
      pendingAction: {
        name: nameMap[intent.kind],
        args: { videoId: target.id, [argKey]: value },
        label,
      },
    };
  }

  // Conversational answer.
  if (!isAiConfigured()) {
    return { content: fallbackChat() };
  }
  try {
    const system = `You are TubePath's AI growth coach for the channel "${ctx.channelTitle}". Be concise, specific, and encouraging. Recent context: views change ${ctx.viewsChange.toFixed(0)}%, engagement change ${ctx.engagementChange.toFixed(0)}%, top video "${ctx.topVideoTitle}".`;
    const content = await geminiText(system, message);
    return { content };
  } catch {
    return { content: fallbackChat() };
  }
}
