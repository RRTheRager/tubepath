export type TrafficPatternKind =
  | "suggested"
  | "browse"
  | "search"
  | "external"
  | "mixed";

export interface TrafficStage {
  id: string;
  label: string;
  pct: number;
  description: string;
}

export interface PipelineVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  engagementRate: number;
  topic: string;
  pattern: TrafficPatternKind;
  performance: "strong" | "average" | "weak";
  isOwn: boolean;
  /** True when stats come from public API only (competitors). */
  isPublicData: boolean;
}

export interface CompetitorChannel {
  id: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  matchScore: number;
  topics: string[];
}

export interface PipelineAdvice {
  headline: string;
  summary: string;
  bullets: string[];
  targetPattern: TrafficPatternKind;
  /** Teaser tier shows truncated advice. */
  isTeaser: boolean;
}

export interface PipelinePayload {
  topic: string;
  dataDays: number;
  thinData: boolean;
  funnel: TrafficStage[];
  ownVideos: PipelineVideo[];
  competitorVideos: PipelineVideo[];
  competitors: CompetitorChannel[];
  advice: PipelineAdvice;
  generatedAt: string;
  /** Set when auto-discovery fails or returns no channels. */
  competitorError?: string;
}
