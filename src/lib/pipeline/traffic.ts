import type { TrafficPatternKind, TrafficStage } from "./types";

const SOURCE_MAP: Record<string, TrafficPatternKind> = {
  RELATED_VIDEO: "suggested",
  RELATED: "suggested",
  YT_SEARCH: "search",
  SEARCH: "search",
  SUBSCRIBER: "browse",
  YT_CHANNEL: "browse",
  BROWSE: "browse",
  BROWSE_FEATURES: "browse",
  EXT_URL: "external",
  EXTERNAL: "external",
  NOTIFICATION: "browse",
  PLAYLIST: "browse",
  END_SCREEN: "suggested",
  SHORTS: "suggested",
  ADVERTISING: "external",
};

export function friendlySource(raw: string): string {
  const key = raw.toUpperCase().replace(/[^A-Z_]/g, "");
  switch (SOURCE_MAP[key] ?? "mixed") {
    case "suggested":
      return "Suggested";
    case "browse":
      return "Browse & subs";
    case "search":
      return "Search";
    case "external":
      return "External";
    default:
      return raw.replace(/_/g, " ").toLowerCase();
  }
}

export function patternFromSources(
  sources: { source: string; pct: number }[]
): TrafficPatternKind {
  if (!sources.length) return "mixed";

  const totals: Record<TrafficPatternKind, number> = {
    suggested: 0,
    browse: 0,
    search: 0,
    external: 0,
    mixed: 0,
  };

  for (const s of sources) {
    const kind = SOURCE_MAP[s.source.toUpperCase()] ?? "mixed";
    if (kind === "mixed") totals.mixed += s.pct;
    else totals[kind] += s.pct;
  }

  const top = (Object.entries(totals) as [TrafficPatternKind, number][])
    .filter(([k]) => k !== "mixed")
    .sort((a, b) => b[1] - a[1])[0];

  if (!top || top[1] < 25) return "mixed";
  return top[0];
}

/** Infer competitor traffic pattern from public signals (estimated). */
export function inferPublicPattern(
  views: number,
  publishedAt: string,
  title: string
): TrafficPatternKind {
  const days = Math.max(
    1,
    (Date.now() - new Date(publishedAt).getTime()) / 86_400_000
  );
  const velocity = views / days;
  const lower = title.toLowerCase();

  if (
    /\b(how to|guide|tips|best|tier list|settings|walkthrough|tutorial)\b/.test(
      lower
    )
  ) {
    return "search";
  }
  if (velocity > 8_000) return "suggested";
  if (velocity > 2_000) return "browse";
  if (/\b(review|reaction|trailer|news|update)\b/.test(lower)) return "search";
  return "mixed";
}

export function performanceTier(
  views: number,
  engagementRate: number,
  medianViews: number
): "strong" | "average" | "weak" {
  const viewScore = views >= medianViews * 1.4 ? 2 : views >= medianViews * 0.7 ? 1 : 0;
  const engScore = engagementRate >= 5 ? 2 : engagementRate >= 2.5 ? 1 : 0;
  const total = viewScore + engScore;
  if (total >= 3) return "strong";
  if (total >= 1) return "average";
  return "weak";
}

export function buildFunnel(
  videos: { pattern: TrafficPatternKind; performance: "strong" | "average" | "weak" }[]
): TrafficStage[] {
  const strong = videos.filter((v) => v.performance === "strong");
  const pool = strong.length >= 2 ? strong : videos;

  const counts: Record<TrafficPatternKind, number> = {
    suggested: 0,
    browse: 0,
    search: 0,
    external: 0,
    mixed: 0,
  };
  for (const v of pool) counts[v.pattern]++;

  const total = pool.length || 1;
  const pct = (k: TrafficPatternKind) =>
    Math.round((counts[k] / total) * 100);

  const suggested = pct("suggested");
  const browse = pct("browse");
  const search = pct("search");
  const external = pct("external");
  const mixed = pct("mixed");

  const discovery =
    suggested >= search && suggested >= browse
      ? { label: "Suggested feed", pct: suggested + Math.round(mixed * 0.4) }
      : search >= browse
        ? { label: "Search discovery", pct: search + Math.round(mixed * 0.4) }
        : { label: "Browse & home", pct: browse + Math.round(mixed * 0.4) };

  const clickThrough = Math.min(
    95,
    Math.max(18, Math.round(32 + (suggested > 40 ? 8 : 0)))
  );
  const watch = Math.min(
    95,
    Math.max(25, Math.round(48 + (search > 35 ? 10 : 0)))
  );
  const convert = Math.min(
    90,
    Math.max(8, Math.round(12 + (browse > 30 ? 6 : 0)))
  );

  return [
    {
      id: "discovery",
      label: discovery.label,
      pct: Math.min(100, discovery.pct || 35),
      description: "Where viewers first find videos in this topic path",
    },
    {
      id: "click",
      label: "Thumbnail click",
      pct: clickThrough,
      description: "Estimated CTR strength for this path (inferred)",
    },
    {
      id: "watch",
      label: "Watch & engage",
      pct: watch,
      description: "Viewers who stay and interact",
    },
    {
      id: "convert",
      label: "Subscribe / return",
      pct: convert,
      description: "Viewers who join or come back",
    },
  ];
}

export function patternLabel(kind: TrafficPatternKind): string {
  switch (kind) {
    case "suggested":
      return "Suggested-heavy";
    case "browse":
      return "Browse-heavy";
    case "search":
      return "Search-heavy";
    case "external":
      return "External-heavy";
    default:
      return "Mixed path";
  }
}
