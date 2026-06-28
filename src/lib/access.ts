import type { AccessLevel, MetricKey, SubscriptionStatus } from "./types";

// ---------------------------------------------------------------------------
// Single source of truth for what each subscription status unlocks.
//
//   trialing  -> "limited"  (intentionally reduced: no AI, capped analytics)
//   active    -> "full"     (everything unlocks once paid)
//   past_due  -> "limited"  (payment failing: dropped to trial-level access
//                            during a 7-day grace window; store.ts reconciles
//                            to "canceled" -> paywall if still unpaid after it)
//   none/cancel -> "none"   (paywall)
// ---------------------------------------------------------------------------

export function accessLevelFor(status: SubscriptionStatus): AccessLevel {
  switch (status) {
    case "active":
      return "full";
    case "trialing":
    case "past_due":
      return "limited";
    case "none":
    case "canceled":
    default:
      return "none";
  }
}

export interface Capabilities {
  level: AccessLevel;
  /** Can the user open the app at all (vs the paywall)? */
  canEnterApp: boolean;
  /** AI features: chatbot, suggestions, anomaly explanations. */
  ai: boolean;
  /** Advanced analytics charts beyond the basic views chart. */
  advancedCharts: boolean;
  /** Per-video deep-dive analytics. */
  videoDeepDive: boolean;
  /** Spike / anomaly detection surfaced + tappable. */
  anomalyDetection: boolean;
  /** Competitor benchmarking. */
  competitors: boolean;
  /** Export to CSV. */
  exportData: boolean;
  /** Max days of history available. */
  historyDays: number;
  /** Charts that are unlocked. */
  enabledCharts: MetricKey[];
  /** Number of channels the user can track. */
  maxChannels: number;
}

const BASE_CHARTS: MetricKey[] = ["views"];
const ALL_CHARTS: MetricKey[] = [
  "views",
  "engagement",
  "watchTime",
  "ctr",
  "subscribers",
  "likes",
  "comments",
];

export function capabilitiesFor(status: SubscriptionStatus): Capabilities {
  const level = accessLevelFor(status);

  if (level === "full") {
    return {
      level,
      canEnterApp: true,
      ai: true,
      advancedCharts: true,
      videoDeepDive: true,
      anomalyDetection: true,
      competitors: true,
      exportData: true,
      historyDays: 730,
      enabledCharts: ALL_CHARTS,
      maxChannels: 10,
    };
  }

  if (level === "limited") {
    // 3-day trial: usable but deliberately worse.
    return {
      level,
      canEnterApp: true,
      ai: false,
      advancedCharts: false,
      videoDeepDive: false,
      anomalyDetection: false,
      competitors: false,
      exportData: false,
      historyDays: 30,
      enabledCharts: BASE_CHARTS,
      maxChannels: 1,
    };
  }

  // none / canceled -> paywall
  return {
    level,
    canEnterApp: false,
    ai: false,
    advancedCharts: false,
    videoDeepDive: false,
    anomalyDetection: false,
    competitors: false,
    exportData: false,
    historyDays: 0,
    enabledCharts: [],
    maxChannels: 0,
  };
}

export function trialDaysRemaining(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const ms = new Date(trialEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
