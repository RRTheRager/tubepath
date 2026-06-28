"use client";

import type { VideoSummary } from "@tubepath/core";
import { formatMetricValue } from "@tubepath/core";
import { AnimatedNumber, MetricChart } from "@tubepath/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { metricsToChart } from "@/lib/demo-data";

export function VideosPage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [tier, setTier] = useState<"free" | "pro">("free");

  useEffect(() => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.videos ?? []);
        setTier(d.tier ?? "free");
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Videos</h1>
      <div className="space-y-4">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/app/videos/${video.id}`}
            className="flex gap-4 rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md transition hover:border-primary/30"
          >
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-24 w-40 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-semibold">{video.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {video.views.toLocaleString()} views •{" "}
                {formatMetricValue("engagement", video.engagementRate)} engagement
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Views</span>
                  <AnimatedNumber value={video.views} className="block font-semibold" />
                </div>
                <div>
                  <span className="text-muted-foreground">Likes</span>
                  <AnimatedNumber value={video.likes} className="block font-semibold" />
                </div>
                <div>
                  <span className="text-muted-foreground">Comments</span>
                  <AnimatedNumber value={video.comments} className="block font-semibold" />
                </div>
                <div>
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="block font-semibold">
                    {video.engagementRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function VideoDetailPage({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoSummary | null>(null);
  const [tier, setTier] = useState<"free" | "pro">("free");

  useEffect(() => {
    fetch(`/api/videos/${videoId}`)
      .then((r) => r.json())
      .then((d) => {
        setVideo(d.video);
        setTier(d.tier ?? "free");
      });
  }, [videoId]);

  if (!video) return null;

  const mockMetrics = Array.from({ length: 14 }).map((_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
    views: Math.floor(video.views * (0.05 + (i / 14) * 0.95)),
    engagementRate: video.engagementRate * (0.8 + Math.random() * 0.4),
    likes: Math.floor(video.likes * (i / 14)),
    comments: Math.floor(video.comments * (i / 14)),
    subscribersGained: 0,
    subscribersLost: 0,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <img
        src={video.thumbnailUrl}
        alt=""
        className="aspect-video w-full rounded-xl object-cover"
      />
      <h1 className="text-2xl font-bold">{video.title}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(["views", "likes", "comments"] as const).map((key) => (
          <div key={key} className="rounded-xl border border-border/50 bg-card/40 p-4">
            <p className="text-xs uppercase text-muted-foreground">{key}</p>
            <AnimatedNumber
              value={video[key === "views" ? "views" : key]}
              className="text-2xl font-bold"
            />
          </div>
        ))}
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-xs uppercase text-muted-foreground">Engagement</p>
          <span className="text-2xl font-bold">{video.engagementRate.toFixed(2)}%</span>
        </div>
      </div>
      <MetricChart
        data={metricsToChart(mockMetrics, "views")}
        title="Views over time"
      />
      {tier === "pro" && (
        <MetricChart
          data={metricsToChart(mockMetrics, "engagement")}
          title="Engagement over time"
          color="hsl(142, 76%, 45%)"
          formatValue={(v) => `${v.toFixed(2)}%`}
        />
      )}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium">
          This video&apos;s engagement is{" "}
          {video.engagementRate > 7 ? "above" : "below"} your channel average.
        </p>
      </div>
    </div>
  );
}
