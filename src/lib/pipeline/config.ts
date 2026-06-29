/** Max auto-discovered competitors (override via PIPELINE_MAX_COMPETITORS). */
export const PIPELINE_MAX_COMPETITORS = Math.min(
  Math.max(Number(process.env.PIPELINE_MAX_COMPETITORS ?? 4), 3),
  5
);

/** In-process cache TTL for pipeline + competitor results. */
export const PIPELINE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** Subscriber band for competitor matching (defaults; widened for tiny channels). */
export function competitorSubBounds(subscriberCount: number): {
  min: number;
  max: number;
} {
  if (subscriberCount < 500) {
    return { min: subscriberCount * 0.25, max: subscriberCount * 8 };
  }
  if (subscriberCount < 5_000) {
    return { min: subscriberCount * 0.4, max: subscriberCount * 6 };
  }
  return { min: subscriberCount * 0.5, max: subscriberCount * 5 };
}
