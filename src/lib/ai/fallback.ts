import type {
  InsightCard,
  SuggestionBundle,
} from "@/lib/types";
import { AI_SUPPORT_MESSAGE } from "./constants";

export function fallbackSuggestions(): SuggestionBundle {
  return {
    titles: [],
    description: { hook: "", body: "", cta: "", hashtags: [] },
    tags: [],
    hook: { script: "", retentionTactics: [] },
    tips: [],
    ai: false,
  };
}

export function fallbackInsights(): InsightCard[] {
  return [];
}

export function fallbackChat(): string {
  return AI_SUPPORT_MESSAGE;
}

export { AI_SUPPORT_MESSAGE };
