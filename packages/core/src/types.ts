export type SubscriptionTier = "free" | "pro";

export type ChannelRole = "owner" | "manager" | "content_owner";

export type MetricKey =
  | "views"
  | "subscribers"
  | "likes"
  | "comments"
  | "engagement";

export interface DailyMetric {
  date: string;
  views: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

export interface MetricSnapshot {
  views: number;
  subscribers: number;
  likes: number;
  comments: number;
  engagementRate: number;
  periodChange: Partial<Record<MetricKey, number>>;
}

export interface MetricAnomaly {
  date: string;
  metric: MetricKey;
  value: number;
  zScore: number;
  videoId?: string;
  direction: "spike" | "dip";
}

export interface ChannelSummary {
  id: string;
  youtubeChannelId: string;
  title: string;
  thumbnailUrl: string;
  role: ChannelRole;
  subscriberCount: number;
}

export interface VideoSummary {
  id: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

export interface PulseHeadline {
  text: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface DailyPulse {
  viewsDelta: number;
  engagementDelta: number;
  subscribersDelta: number;
  likesDelta: number;
  commentsDelta: number;
  headline: string;
}

export interface InsightCard {
  id: string;
  type: "engagement" | "views" | "general" | "competitor" | "pipeline";
  summary: string;
  detail?: string;
  actions?: string[];
  priority: "high" | "medium" | "low";
}

export interface MetricTip {
  summary: string;
  causes: string[];
  actions: string[];
  priority: "high" | "medium" | "low";
}

export interface TitleOption {
  text: string;
  rationale: string;
  seoScore: number;
}

export interface DescriptionSuggestion {
  hook: string;
  body: string;
  cta: string;
  timestamps: { time: string; label: string }[];
}

export interface TagSuggestion {
  tag: string;
  relevance: number;
  searchVolumeEstimate: "low" | "medium" | "high";
}

export interface HookSuggestion {
  first30SecScript: string;
  retentionTactics: string[];
}

export type PipelineNodeType =
  | "external_video"
  | "competitor_video"
  | "note"
  | "draft"
  | "published_video";

export type PipelineEdgeType =
  | "inspired_by"
  | "referenced"
  | "response_to"
  | "remix_of";

export interface PipelineNode {
  id: string;
  type: PipelineNodeType;
  title: string;
  url?: string;
  thumbnailUrl?: string;
  notes?: string;
  videoId?: string;
  createdAt: string;
}

export interface PipelineEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: PipelineEdgeType;
}

export interface CompetitorChannel {
  id: string;
  youtubeChannelId: string;
  nickname: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
}

export interface TierLimits {
  maxGoogleAccounts: number;
  maxChannels: number;
  historyDays: number;
  aiTipsPerDay: number;
  aiOptimizePerDay: number;
  maxCompetitors: number;
  syncIntervalHours: number;
  graphsEnabled: MetricKey[];
  canEdit: boolean;
  canUseNative: boolean;
  canUsePipeline: boolean;
  canUsePreviews: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxGoogleAccounts: 1,
    maxChannels: 1,
    historyDays: 30,
    aiTipsPerDay: 3,
    aiOptimizePerDay: 1,
    maxCompetitors: 0,
    syncIntervalHours: 24,
    graphsEnabled: ["views"],
    canEdit: false,
    canUseNative: false,
    canUsePipeline: false,
    canUsePreviews: false,
  },
  pro: {
    maxGoogleAccounts: 10,
    maxChannels: 50,
    historyDays: 730,
    aiTipsPerDay: Infinity,
    aiOptimizePerDay: Infinity,
    maxCompetitors: 10,
    syncIntervalHours: 1,
    graphsEnabled: ["views", "subscribers", "likes", "comments", "engagement"],
    canEdit: true,
    canUseNative: true,
    canUsePipeline: true,
    canUsePreviews: true,
  },
};
