import { isAiConfigured } from "@/lib/env";
import type { InsightCard } from "@/lib/types";
import { geminiJson } from "./gemini";
import { AI_SUPPORT_MESSAGE } from "./constants";
import { AI_REALISM_RULES } from "./tone";
import type { RichAnalyticsContext } from "./analytics-context";

export interface AnalyticsBrief {
  headline: string;
  paragraphs: string[];
  comparisons: {
    label: string;
    detail: string;
    source: "your_analytics" | "public";
  }[];
  thinDataWarning?: string;
}

export async function generateAnalyticsBrief(
  ctx: RichAnalyticsContext
): Promise<{ brief: AnalyticsBrief | null; error?: string }> {
  if (!ctx.youtubeConnected) {
    return { brief: null, error: "Connect YouTube to load analytics insights." };
  }

  if (!isAiConfigured()) {
    return {
      brief: {
        headline: "Analytics summary",
        paragraphs: [
          ctx.comparisons.length
            ? "Comparisons below are computed from your connected YouTube data."
            : "Connect AI in production to get a written analysis.",
        ],
        comparisons: ctx.comparisons,
      },
      error: AI_SUPPORT_MESSAGE,
    };
  }

  const thinNote = ctx.thinData
    ? "Limited history — treat conclusions as directional, not definitive."
    : undefined;

  try {
    const system = `You are TubePath's analytics engine for YouTube creators.

Rules:
- NEVER give generic YouTube advice.
- ONLY use numbers and facts from the provided data block.
- Always cite specific metrics (views, %, dates) in comparisons.
- Label competitor stats as public data.
- If data is thin, say so explicitly and avoid strong conclusions.
${AI_REALISM_RULES}

Return JSON: {"headline":string,"paragraphs":string[],"comparisons":[{"label":string,"detail":string,"source":"your_analytics"|"public"}]}`;

    const result = await geminiJson<Omit<AnalyticsBrief, "thinDataWarning">>(
      system,
      ctx.promptBlock,
      { temperature: 0.35 }
    );

    const comparisons =
      result.comparisons?.length ? result.comparisons : ctx.comparisons;

    return {
      brief: {
        headline: result.headline,
        paragraphs: result.paragraphs ?? [],
        comparisons,
        thinDataWarning: thinNote,
      },
    };
  } catch {
    return {
      brief: {
        headline: "Your numbers at a glance",
        paragraphs: ["AI narrative unavailable — comparisons below use your live data."],
        comparisons: ctx.comparisons,
        thinDataWarning: thinNote,
      },
      error: AI_SUPPORT_MESSAGE,
    };
  }
}

export async function generateAnalyticsInsights(
  ctx: RichAnalyticsContext
): Promise<{ insights: InsightCard[]; error?: string }> {
  if (!ctx.youtubeConnected) {
    return { insights: [], error: "Connect YouTube first." };
  }
  if (!isAiConfigured()) {
    return { insights: [], error: AI_SUPPORT_MESSAGE };
  }

  try {
    const system = `You are a data-first YouTube analytics coach.

Return JSON {"cards":[{"id","tone":"positive|neutral|negative|tip","emoji","headline","detail","deltaLabel?"}]}. Max 4 cards.
Every card MUST cite a specific number from the data. No generic tips.
Use "negative" or "neutral" tone when metrics declined or stalled — do not spin bad news as good.
${ctx.thinData ? "Warn that data is limited." : ""}
${AI_REALISM_RULES}`;

    const result = await geminiJson<{ cards: Omit<InsightCard, "ai">[] }>(
      system,
      ctx.promptBlock,
      { temperature: 0.35 }
    );

    return {
      insights: (result.cards ?? []).map((c) => ({ ...c, ai: true })),
      error: ctx.thinData
        ? "Limited analytics history — insights may be less accurate."
        : undefined,
    };
  } catch {
    return { insights: [], error: AI_SUPPORT_MESSAGE };
  }
}
