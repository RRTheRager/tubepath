"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageSquare } from "lucide-react";
import type { VideoSummary } from "@/lib/types";
import { Loading } from "@/components/ui/Loading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { formatCompact, formatRelativeDate, formatDuration } from "@/lib/utils";

type Sort = "recent" | "views" | "engagement";

export default function VideosPage() {
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const [videos, setVideos] = useState<VideoSummary[] | null>(null);
  const [sort, setSort] = useState<Sort>("recent");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasChannel) {
      setLoading(false);
      return;
    }
    fetch("/api/videos", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.youtubeConnected) setVideos(j.videos ?? []);
        else setVideos(null);
      })
      .catch(() => setVideos(null))
      .finally(() => setLoading(false));
  }, [hasChannel]);

  const sorted = useMemo(() => {
    if (!videos) return [];
    const copy = [...videos];
    if (sort === "views") copy.sort((a, b) => b.views - a.views);
    else if (sort === "engagement")
      copy.sort((a, b) => b.engagementRate - a.engagementRate);
    else copy.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    return copy;
  }, [videos, sort]);

  if (ytLoading || (hasChannel && loading)) {
    return <Loading label="Loading videos" />;
  }

  if (!hasChannel) {
    return <YouTubeConnectPrompt variant="select-channel" />;
  }

  if (videos === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t load your videos. Try reconnecting Google in
          Settings.
        </p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          No videos found on this channel yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
          <p className="text-sm text-muted-foreground">
            {videos.length} uploads
          </p>
        </div>
        <SegmentedControl
          options={[
            { value: "recent", label: "Recent" },
            { value: "views", label: "Top views" },
            { value: "engagement", label: "Engagement" },
          ]}
          value={sort}
          onChange={setSort}
          size="sm"
        />
      </div>

      <div className="space-y-2.5">
        {sorted.map((v) => (
          <Link
            key={v.id}
            href={`/app/videos/${v.id}`}
            className="app-card group flex items-center gap-4 p-3 transition-all hover:shadow-app"
          >
            <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.thumbnailUrl}
                alt={v.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-white">
                {formatDuration(v.durationSeconds)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                {v.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatRelativeDate(v.publishedAt)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {formatCompact(v.views)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {formatCompact(v.likes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />{" "}
                  {formatCompact(v.comments)}
                </span>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold tabular-nums">
                {v.engagementRate.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground">engagement</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
