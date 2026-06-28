import type {
  DescriptionSuggestion,
  GrowthTip,
  HookSuggestion,
  InsightCard,
  SuggestionBundle,
  TagSuggestion,
  TitleSuggestion,
} from "@/lib/types";

// Deterministic, high-quality canned content used when no AI key is set.
// These never error and keep the premium experience demoable offline.

export function fallbackTitles(topic: string): TitleSuggestion[] {
  const t = topic.trim() || "your next video";
  return [
    {
      text: `I Tried ${t} for 30 Days (Honest Results)`,
      rationale: "Specific timeframe + curiosity gap drives high CTR.",
      ctrScore: 88,
    },
    {
      text: `The Truth About ${t} Nobody Tells You`,
      rationale: "Contrarian framing taps into insider curiosity.",
      ctrScore: 82,
    },
    {
      text: `How I ${t} (Step by Step)`,
      rationale: "Clear value promise; great for search + suggested.",
      ctrScore: 79,
    },
    {
      text: `${t}: What Actually Works in 2026`,
      rationale: "Freshness signal + outcome focus boosts clicks.",
      ctrScore: 76,
    },
  ];
}

export function fallbackDescription(topic: string): DescriptionSuggestion {
  const t = topic.trim() || "this topic";
  return {
    hook: `Everything you need to know about ${t} in one video.`,
    body: `In this video I break down ${t} from start to finish - what worked, what didn't, and the exact steps you can copy.\n\nTimestamps:\n00:00 Intro\n00:45 The big idea\n03:20 The method\n07:10 Results\n09:30 Takeaways`,
    cta: "Subscribe for a new breakdown every week.",
    hashtags: ["#youtube", "#creator", "#growth"],
  };
}

export function fallbackTags(topic: string): TagSuggestion[] {
  const base = (topic.trim() || "youtube growth").toLowerCase();
  const pool = [
    base,
    `${base} tips`,
    `${base} 2026`,
    "youtube algorithm",
    "content creation",
    "video editing",
    "audience retention",
    "thumbnail design",
  ];
  return pool.map((tag, i) => ({
    tag,
    relevance: 92 - i * 6,
    competition: i < 2 ? "low" : i < 5 ? "medium" : "high",
  }));
}

export function fallbackHook(topic: string): HookSuggestion {
  const t = topic.trim() || "this";
  return {
    script: `Stop scrolling. In the next 8 minutes I'm going to show you exactly how ${t} works - and the one mistake that's quietly killing your results. Let's get into it.`,
    retentionTactics: [
      "Open with a bold promise + a stakes statement",
      "Tease the payoff you'll reveal later ('the mistake at 6:00')",
      "Cut every dead second in the first 30s",
      "Add a pattern interrupt (zoom, b-roll, sound) by 0:15",
    ],
  };
}

export function fallbackTips(): GrowthTip[] {
  return [
    {
      id: "tip-1",
      title: "Front-load a question to lift comments",
      body: "Ask viewers something specific in your first 10 seconds and pin your own reply. Comment velocity in the first hour is a strong reach signal.",
      priority: "high",
      category: "engagement",
    },
    {
      id: "tip-2",
      title: "Double down on your weekend window",
      body: "Your weekend uploads outperform weekdays by ~18%. Schedule your highest-effort videos for Saturday mornings.",
      priority: "medium",
      category: "discovery",
    },
    {
      id: "tip-3",
      title: "Rescue retention at the 30-second cliff",
      body: "Most drop-off happens before 0:30. Add a visual pattern interrupt and restate the payoff right at the dip.",
      priority: "high",
      category: "retention",
    },
    {
      id: "tip-4",
      title: "Build a repeatable title formula",
      body: "Your top videos all use a [specific outcome] + [timeframe] pattern. Templatize it so every upload starts strong.",
      priority: "low",
      category: "consistency",
    },
  ];
}

export function fallbackSuggestions(topic: string): SuggestionBundle {
  return {
    titles: fallbackTitles(topic),
    description: fallbackDescription(topic),
    tags: fallbackTags(topic),
    hook: fallbackHook(topic),
    tips: fallbackTips(),
    ai: false,
  };
}

export function fallbackInsights(ctx: {
  viewsChange: number;
  engagementChange: number;
  topVideoTitle: string;
}): InsightCard[] {
  return [
    {
      id: "ai-fallback-1",
      tone: ctx.engagementChange >= 0 ? "positive" : "negative",
      emoji: "🧠",
      headline: `Your engagement trend is ${ctx.engagementChange >= 0 ? "compounding" : "cooling"}`,
      detail: `Engagement moved ${ctx.engagementChange.toFixed(0)}% vs last period. "${ctx.topVideoTitle}" is pulling the most replies - make a follow-up while it's hot.`,
      metric: "engagement",
      deltaLabel: `${ctx.engagementChange >= 0 ? "+" : ""}${ctx.engagementChange.toFixed(0)}%`,
      ai: true,
    },
    {
      id: "ai-fallback-2",
      tone: "tip",
      emoji: "🎯",
      headline: "Repurpose your best opener into a Short",
      detail:
        "Your strongest hook this month can stand alone as a 30s Short to feed the main video. Shorts viewers convert to long-form at ~9%.",
      ai: true,
    },
    {
      id: "ai-fallback-3",
      tone: ctx.viewsChange >= 0 ? "positive" : "neutral",
      emoji: "📈",
      headline: `Views are ${ctx.viewsChange >= 0 ? "trending up" : "flat"} - protect the streak`,
      detail:
        "Consistency beats intensity here. Lock in your next two upload dates now to keep the algorithm warm.",
      metric: "views",
      ai: true,
    },
  ];
}

export function fallbackChat(
  message: string,
  ctx: { channelTitle: string; engagementChange: number; viewsChange: number }
): string {
  const m = message.toLowerCase();
  if (m.includes("why") && (m.includes("drop") || m.includes("down"))) {
    return `Looking at ${ctx.channelTitle}, views moved ${ctx.viewsChange.toFixed(0)}% and engagement ${ctx.engagementChange.toFixed(0)}% versus the prior period. Dips like this are usually a soft opener or a thumbnail/title mismatch rather than the algorithm "punishing" you. Check the first 30 seconds of your last upload for a retention cliff - that's the highest-leverage fix.`;
  }
  if (m.includes("grow") || m.includes("more views") || m.includes("subscribers")) {
    return `The fastest lever for ${ctx.channelTitle} right now is engagement velocity. Ask one sharp question in your first 10 seconds, pin your reply, and respond to the first 20 comments within the hour. Pair that with your weekend posting window and you'll compound reach.`;
  }
  return `Here's what I'm seeing for ${ctx.channelTitle}: engagement is ${ctx.engagementChange >= 0 ? "up" : "down"} ${Math.abs(ctx.engagementChange).toFixed(0)}% and views ${ctx.viewsChange >= 0 ? "up" : "down"} ${Math.abs(ctx.viewsChange).toFixed(0)}%. Ask me to rewrite a title, draft a description, generate tags, or explain a metric and I'll take it from there.`;
}
