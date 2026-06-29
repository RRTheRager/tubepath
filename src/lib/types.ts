// ---------------------------------------------------------------------------
// Domain types shared across the app
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | "none" // never subscribed
  | "trialing" // 3-day trial, LIMITED access
  | "active" // paid, FULL access
  | "past_due" // payment failing, brief grace
  | "canceled"; // lapsed -> no access

/** What a given subscription status unlocks. */
export type AccessLevel = "none" | "limited" | "full";

export interface Account {
  id: string;
  email: string | null;
  name: string;
  status: SubscriptionStatus;
  /** ISO timestamp when the trial ends (if trialing). */
  trialEnd: string | null;
  /** ISO timestamp when the current paid period ends. */
  currentPeriodEnd: string | null;
  /** ISO timestamp when the past_due grace period ends (then -> paywall). */
  graceEndsAt?: string | null;
  /** Whether the subscription is set to cancel at period end. */
  cancelAtPeriodEnd: boolean;
  /** Whether a real YouTube channel is connected (vs mock data). */
  youtubeConnected: boolean;
  /** Login streak in days. */
  streak: number;
  /** Stripe identifiers (only set when real billing is configured). */
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  /** Connected YouTube channel id (set after OAuth). */
  youtubeChannelId?: string | null;
  /** Channels for the active Google account (managers first when listed). */
  youtubeChannels?: YouTubeChannelLink[];
  /** Active connected Google login (OAuth). */
  activeGoogleAccountId?: string | null;
}

/** A YouTube channel the signed-in Google user can access. */
export interface YouTubeChannelLink {
  id: string;
  title: string;
  handle: string;
  thumbnailUrl: string;
  /** Manager = Brand account you manage; owner = your personal/owned channel. */
  role: "manager" | "owner";
}

/** Connected Google login with OAuth tokens (server-side only). */
export interface GoogleAccount {
  id: string;
  tubepathAccountId: string;
  googleSub: string;
  email: string;
  name: string;
  pictureUrl: string;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiry: number | null;
  youtubeChannels: YouTubeChannelLink[];
  /** Last selected channel while this Google account was active. */
  activeChannelId: string | null;
}

/** Safe subset exposed to the client (no tokens). */
export interface GoogleAccountSummary {
  id: string;
  email: string;
  name: string;
  pictureUrl: string;
  channelCount: number;
}

/**
 * Token bundle for API calls. Maps to the active GoogleAccount row.
 * NEVER sent to the client.
 */
export interface GoogleCredentials {
  googleAccountId: string;
  tubepathAccountId: string;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiry: number | null;
}

export type MetricKey =
  | "views"
  | "subscribers"
  | "likes"
  | "comments"
  | "watchTime"
  | "ctr"
  | "engagement";

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  views: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
  watchTimeHours: number;
  impressions: number;
  ctr: number; // click-through rate %
  engagementRate: number; // (likes + comments) / views %
}

export interface ChannelSummary {
  id: string;
  title: string;
  handle: string;
  thumbnailUrl: string;
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
}

export interface MetricSnapshot {
  views: number;
  subscribers: number;
  likes: number;
  comments: number;
  watchTimeHours: number;
  ctr: number;
  engagementRate: number;
  /** Percent change vs previous comparable period. */
  periodChange: Partial<Record<MetricKey, number>>;
}

export interface Anomaly {
  date: string;
  metric: MetricKey;
  value: number;
  zScore: number;
  direction: "spike" | "dip";
  videoId?: string;
  videoTitle?: string;
}

export interface VideoSummary {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  watchTimeHours: number;
  avgViewDurationSeconds: number;
  ctr: number;
  engagementRate: number;
  retentionPct: number;
}

export interface VideoDetail extends VideoSummary {
  description: string;
  tags: string[];
  dailyViews: { date: string; views: number }[];
  retentionCurve: { pct: number; audience: number }[];
  trafficSources: { source: string; pct: number }[];
}

export type InsightTone = "positive" | "neutral" | "negative" | "tip";

export interface InsightCard {
  id: string;
  tone: InsightTone;
  emoji: string;
  headline: string;
  detail: string;
  metric?: MetricKey;
  /** delta value to show as a count-up, e.g. +28 */
  deltaLabel?: string;
  /** Whether this insight is AI-generated (premium) vs canned (trial). */
  ai: boolean;
}

export interface DailyPulse {
  headline: string;
  tone: InsightTone;
  viewsDelta: number;
  engagementDelta: number;
  subscribersDelta: number;
  streak: number;
  lastSynced: string;
}

export interface StudioBreakdownRow {
  label: string;
  views: number;
  pct: number;
}

export interface StudioRevenue {
  estimatedRevenue: number;
  estimatedAdRevenue: number;
  playbackCpm: number;
  rpm: number;
}

export interface StudioAnalytics {
  periodDays: number;
  monetized: boolean;
  totals: {
    views: number;
    impressions: number;
    ctr: number;
    watchTimeHours: number;
    avgViewDurationSeconds: number;
    avgViewPercentage: number;
    subscribersGained: number;
    subscribersLost: number;
    likes: number;
    comments: number;
    shares: number;
  };
  revenue: StudioRevenue | null;
  trafficSources: StudioBreakdownRow[];
  devices: StudioBreakdownRow[];
  countries: StudioBreakdownRow[];
}

export interface OverviewPayload {
  channel: ChannelSummary;
  snapshot: MetricSnapshot;
  metrics: DailyMetric[];
  anomalies: Anomaly[];
  pulse: DailyPulse;
  insights: InsightCard[];
  studio?: StudioAnalytics;
}

// ---- AI suggestion shapes -------------------------------------------------

export interface TitleSuggestion {
  text: string;
  rationale: string;
  ctrScore: number; // 0-100
}

export interface DescriptionSuggestion {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface TagSuggestion {
  tag: string;
  relevance: number; // 0-100
  competition: "low" | "medium" | "high";
}

export interface HookSuggestion {
  script: string;
  retentionTactics: string[];
}

export interface GrowthTip {
  id: string;
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
  category: "engagement" | "discovery" | "retention" | "consistency";
}

export interface SuggestionBundle {
  titles: TitleSuggestion[];
  description: DescriptionSuggestion;
  tags: TagSuggestion[];
  hook: HookSuggestion;
  tips: GrowthTip[];
  ai: boolean; // true if produced by a real model, false if fallback
}

// ---- Chatbot --------------------------------------------------------------

export type ChatRole = "user" | "assistant" | "system";

export interface ChatToolCall {
  name: string;
  args: Record<string, unknown>;
  label: string; // human-readable description for the confirm step
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Proposed action awaiting user confirmation. */
  pendingAction?: ChatToolCall;
  /** Result text after an action was executed. */
  actionResult?: string;
}
