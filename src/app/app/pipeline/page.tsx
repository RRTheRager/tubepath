"use client";

import { useEffect, useState } from "react";
import { GitBranch, Sparkles, Users } from "lucide-react";
import type { PipelinePayload } from "@/lib/pipeline/types";
import { useSession } from "@/components/providers/SessionProvider";
import { useActivatePremium } from "@/components/access/useActivatePremium";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { PipelineFunnel } from "@/components/pipeline/PipelineFunnel";
import { PipelineVideoList } from "@/components/pipeline/PipelineVideoList";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { formatCompact } from "@/lib/utils";

export default function PipelinePage() {
  const { data: session } = useSession();
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const { activate, busy } = useActivatePremium();
  const [pipeline, setPipeline] = useState<PipelinePayload | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasChannel) {
      setLoading(false);
      return;
    }
    fetch("/api/pipeline", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.pipeline) {
          setPipeline(j.pipeline);
          setIsFull(!!j.isFull);
        } else {
          setError(j.error ?? "Pipeline unavailable");
        }
      })
      .catch(() =>
        setError(
          "This isn't working right now. Please try again or contact support."
        )
      )
      .finally(() => setLoading(false));
  }, [hasChannel]);

  if (ytLoading || (hasChannel && loading)) {
    return <Loading label="Mapping your topic pipeline" />;
  }

  if (!hasChannel) {
    return <YouTubeConnectPrompt variant="select-channel" />;
  }

  if (error || !pipeline) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          {error ??
            "We couldn't load your pipeline. Please try again or contact support."}
        </p>
      </div>
    );
  }

  const teaser = !isFull;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <GitBranch className="h-6 w-6 text-primary" /> Topic Pipeline
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How videos in <strong>{pipeline.topic}</strong> get discovered, and
          which paths win.
        </p>
        {pipeline.thinData && (
          <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            Limited history — results may be less accurate until you have more
            uploads and analytics data.
          </p>
        )}
      </div>

      <Card>
        <CardHeader
          title="Recommended path"
          subtitle={pipeline.advice.headline}
        />
        <p className="text-sm text-muted-foreground">{pipeline.advice.summary}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {pipeline.advice.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {teaser && (
          <Button className="mt-4" onClick={activate} disabled={busy} size="sm">
            Unlock full pipeline analysis
          </Button>
        )}
      </Card>

      <div className="relative">
        <Card>
          <CardHeader title="Discovery funnel" subtitle="Inferred traffic pattern" />
          <PipelineFunnel stages={pipeline.funnel} blurred={teaser} />
        </Card>
        {teaser && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/55 p-6 text-center backdrop-blur-[1px]">
            <p className="font-semibold">Full funnel locked</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Upgrade to Premium to see the complete discovery path and
              step-by-step targets.
            </p>
            <Button className="mt-3" onClick={activate} disabled={busy} size="sm">
              Unlock with Premium
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <PipelineVideoList
            title="Competitor uploads"
            videos={pipeline.competitorVideos}
            blurred={teaser}
          />
        </Card>
        <Card>
          <PipelineVideoList
            title="Your uploads"
            videos={pipeline.ownVideos}
            blurred={teaser}
          />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Auto-tracked competitors"
          action={
            <Badge tone="neutral">
              <Users className="mr-1 h-3 w-3" />
              {pipeline.competitors.length} channels
            </Badge>
          }
        />
        <div className={teaser ? "blur-[5px] saturate-50" : undefined}>
          <div className="flex flex-wrap gap-2">
            {pipeline.competitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                {c.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnailUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                )}
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCompact(c.subscriberCount)} subs · Public data
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {teaser && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Upgrade to unlock competitor details and full path analysis.
          </p>
        )}
      </Card>
    </div>
  );
}
