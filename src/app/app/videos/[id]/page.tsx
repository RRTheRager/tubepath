"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { VideoDetail } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricChart } from "@/components/charts/MetricChart";
import { UpgradeTeaser } from "@/components/access/UpgradeTeaser";
import { Loading } from "@/components/ui/Loading";
import {
  formatCompact,
  formatDuration,
  formatRelativeDate,
} from "@/lib/utils";

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [deepDive, setDeepDive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/videos/${params.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j) {
          setVideo(j.video);
          setDeepDive(j.deepDive);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Loading label="Loading video" />;
  if (!video)
    return (
      <div className="py-16 text-center text-muted-foreground">
        Video not found.
      </div>
    );

  const stats = [
    { label: "Views", value: formatCompact(video.views) },
    { label: "Likes", value: formatCompact(video.likes) },
    { label: "Comments", value: formatCompact(video.comments) },
    { label: "Engagement", value: `${video.engagementRate.toFixed(1)}%` },
    { label: "CTR", value: `${video.ctr.toFixed(1)}%` },
    { label: "Avg retention", value: `${video.retentionPct.toFixed(0)}%` },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/app/videos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All videos
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted sm:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-snug">{video.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRelativeDate(video.publishedAt)} &middot;{" "}
            {formatDuration(video.durationSeconds)}
            {video.isShort && (
              <>
                {" "}
                &middot; <Badge tone="primary">Short</Badge>
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {video.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="app-card p-3 text-center">
            <p className="text-lg font-bold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Views since publish" subtitle="First 30 days" />
        <MetricChart
          data={video.dailyViews.map((d) => ({ date: d.date, value: d.views }))}
        />
      </Card>

      <UpgradeTeaser
        enabled={deepDive}
        title="Per-video deep dive"
        description="Premium unlocks audience retention curves and traffic source breakdowns for every video."
        minHeight={220}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader title="Audience retention" />
            <div className="space-y-1.5">
              {video.retentionCurve.map((p) => (
                <div key={p.pct} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-muted-foreground tabular-nums">
                    {p.pct}%
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.audience}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Traffic sources" />
            <div className="space-y-2.5">
              {video.trafficSources.map((t) => (
                <div key={t.source}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{t.source}</span>
                    <span className="font-medium tabular-nums">{t.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </UpgradeTeaser>
    </div>
  );
}
