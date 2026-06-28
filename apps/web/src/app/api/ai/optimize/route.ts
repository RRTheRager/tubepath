import { NextResponse } from "next/server";
import {
  generateDescription,
  generateHook,
  generateTags,
  generateTitleOptions,
} from "@tubepath/ai";
import { getSession } from "@/lib/session";
import { getTierLimits } from "@/lib/tier";
import { isDemoMode } from "@/lib/env";

export async function POST(request: Request) {
  const session = await getSession();
  const tier = session?.tier ?? "free";
  const limits = getTierLimits(tier);
  const body = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (tier === "free" && limits.aiOptimizePerDay <= 1) {
    // Allow but track — demo always allows
  }

  const context = {
    currentTitle: body.title,
    description: body.description,
    tags: body.tags ?? [],
    niche: "YouTube creator growth",
  };

  const demoTitles = [
    {
      text: "I Hit 10K Subs Doing THIS (Full Breakdown)",
      rationale: "Personal result + curiosity gap",
      seoScore: 88,
    },
    {
      text: "The YouTube Growth Strategy Nobody Talks About",
      rationale: "Contrarian angle drives clicks",
      seoScore: 85,
    },
    {
      text: "How I Grew From 0 to 10K Subscribers in 6 Months",
      rationale: "Clear transformation promise",
      seoScore: 82,
    },
  ];

  const demoDescription = {
    hook: "Most creators get this wrong — and it costs them thousands of views.",
    body: "In this video I walk through the exact steps I used to grow my channel, including posting schedule, thumbnail strategy, and engagement tactics that actually work.",
    cta: "Subscribe for weekly growth breakdowns.",
    timestamps: [
      { time: "0:00", label: "Intro" },
      { time: "1:30", label: "The strategy" },
      { time: "5:00", label: "Results" },
    ],
  };

  const demoTags = [
    { tag: "youtube growth", relevance: 0.95, searchVolumeEstimate: "high" as const },
    { tag: "how to grow on youtube", relevance: 0.9, searchVolumeEstimate: "high" as const },
    { tag: "creator tips", relevance: 0.85, searchVolumeEstimate: "medium" as const },
  ];

  if (!apiKey || isDemoMode()) {
    switch (body.type) {
      case "title":
        return NextResponse.json({ titles: demoTitles });
      case "description":
        return NextResponse.json({ description: demoDescription });
      case "tags":
        return NextResponse.json({ tags: demoTags });
      case "hook":
        return NextResponse.json({
          hook: {
            first30SecScript:
              "Stop scrolling — if you want to grow on YouTube in 2025, the first 30 seconds of your video matter more than your entire SEO strategy.",
            retentionTactics: [
              "Open with a bold claim",
              "Show proof within 5 seconds",
              "Tease the payoff",
            ],
          },
        });
      default:
        return NextResponse.json({ titles: demoTitles });
    }
  }

  try {
    switch (body.type) {
      case "title": {
        const titles = await generateTitleOptions({ apiKey }, context);
        return NextResponse.json({ titles });
      }
      case "description": {
        const description = await generateDescription({ apiKey }, context);
        return NextResponse.json({ description });
      }
      case "tags": {
        const tags = await generateTags({ apiKey }, context);
        return NextResponse.json({ tags });
      }
      case "hook": {
        const hook = await generateHook({ apiKey }, context);
        return NextResponse.json({ hook });
      }
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: "AI unavailable", titles: demoTitles },
      { status: 503 }
    );
  }
}
