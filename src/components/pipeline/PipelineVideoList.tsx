"use client";

import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import type { PipelineVideo } from "@/lib/pipeline/types";
import { patternLabel } from "@/lib/pipeline/traffic";
import { Badge } from "@/components/ui/Badge";
import { formatCompact, formatRelativeDate } from "@/lib/utils";

export function PipelineVideoList({
  title,
  videos,
  blurred = false,
}: {
  title: string;
  videos: PipelineVideo[];
  blurred?: boolean;
}) {
  if (!videos.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No videos found for this section yet.
      </p>
    );
  }

  return (
    <div className={blurred ? "blur-[5px] saturate-50" : undefined}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {videos.slice(0, 8).map((v) => (
          <div
            key={v.id}
            className="flex items-start gap-3 rounded-lg border border-border p-3"
          >
            {v.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.thumbnailUrl}
                alt=""
                className="h-14 w-24 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="h-14 w-24 shrink-0 rounded-md bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug">
                {v.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {v.isOwn ? "Your channel" : v.channelTitle} ·{" "}
                {formatRelativeDate(v.publishedAt)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone="primary">{patternLabel(v.pattern)}</Badge>
                <Badge
                  tone={
                    v.performance === "strong"
                      ? "success"
                      : v.performance === "weak"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {v.performance === "strong" ? (
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                  ) : v.performance === "weak" ? (
                    <TrendingDown className="mr-0.5 h-3 w-3" />
                  ) : null}
                  {v.performance}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatCompact(v.views)} views
                </span>
                {v.isPublicData && (
                  <span className="text-[10px] text-muted-foreground/80">
                    Public data
                  </span>
                )}
              </div>
            </div>
            {!v.isOwn && (
              <a
                href={`https://youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-primary"
                aria-label="Open on YouTube"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
