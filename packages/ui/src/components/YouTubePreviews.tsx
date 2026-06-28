"use client";

import { cn } from "../lib/cn";

export interface PreviewVideoData {
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelAvatarUrl?: string;
  views?: string;
  publishedAt?: string;
}

interface DesktopWatchPreviewProps {
  video: PreviewVideoData;
  width?: number;
}

export function DesktopWatchPreview({ video, width = 1280 }: DesktopWatchPreviewProps) {
  const scale = Math.min(1, (width - 32) / 1280);
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-[#0f0f0f] text-white"
      style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1280 }}
    >
      <div className="flex gap-4 p-4">
        <div className="flex-1">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-800">
            {video.thumbnailUrl ? (
              <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">Thumbnail</div>
            )}
          </div>
          <h1 className="mt-3 line-clamp-2 text-xl font-semibold">{video.title || "Video title"}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
            <span>{video.views ?? "0 views"}</span>
            <span>{video.publishedAt ?? "Just now"}</span>
          </div>
          <div className="mt-3 flex items-center gap-3 border-b border-zinc-800 pb-3">
            {video.channelAvatarUrl && (
              <img src={video.channelAvatarUrl} alt="" className="h-10 w-10 rounded-full" />
            )}
            <span className="font-medium">{video.channelName}</span>
          </div>
          <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm text-zinc-300">
            {video.description || "Description preview..."}
          </p>
        </div>
        <div className="hidden w-[402px] shrink-0 space-y-2 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-[94px] w-[168px] shrink-0 rounded-lg bg-zinc-800" />
              <div className="space-y-1">
                <div className="h-3 w-full rounded bg-zinc-700" />
                <div className="h-3 w-2/3 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DesktopSearchPreviewProps {
  video: PreviewVideoData;
}

export function DesktopSearchPreview({ video }: DesktopSearchPreviewProps) {
  return (
    <div className="w-full max-w-[1280px] rounded-lg border border-border bg-[#0f0f0f] p-4 text-white">
      <div className="flex gap-4">
        <div className="h-[202px] w-[360px] shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          {video.thumbnailUrl && (
            <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <h3 className="line-clamp-2 text-lg font-medium">{video.title || "Video title"}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {video.views ?? "0 views"} • {video.publishedAt ?? "Recently"}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {video.channelAvatarUrl && (
              <img src={video.channelAvatarUrl} alt="" className="h-6 w-6 rounded-full" />
            )}
            <span className="text-sm text-zinc-300">{video.channelName}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{video.description}</p>
        </div>
      </div>
    </div>
  );
}

interface MobileWatchPreviewProps {
  video: PreviewVideoData;
}

export function MobileWatchPreview({ video }: MobileWatchPreviewProps) {
  return (
    <div
      className="mx-auto overflow-hidden rounded-[2rem] border-4 border-zinc-700 bg-[#0f0f0f] text-white"
      style={{ width: 390, height: 844 }}
    >
      <div className="aspect-video w-full bg-zinc-800">
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <h1 className="line-clamp-2 text-base font-semibold">{video.title || "Video title"}</h1>
        <p className="mt-1 text-xs text-zinc-400">
          {video.views ?? "0 views"} • {video.publishedAt ?? "Just now"}
        </p>
        <div className="mt-3 flex items-center gap-2 border-b border-zinc-800 pb-3">
          {video.channelAvatarUrl && (
            <img src={video.channelAvatarUrl} alt="" className="h-8 w-8 rounded-full" />
          )}
          <span className="text-sm font-medium">{video.channelName}</span>
        </div>
        <p className="mt-2 line-clamp-3 text-xs text-zinc-400">{video.description}</p>
      </div>
    </div>
  );
}

interface TvBrowsePreviewProps {
  video: PreviewVideoData;
}

export function TvBrowsePreview({ video }: TvBrowsePreviewProps) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-[#0f0f0f] text-white"
      style={{ width: 1920, height: 1080, transform: "scale(0.5)", transformOrigin: "top left" }}
    >
      <div className="flex h-full flex-col justify-end p-16">
        <div className="flex gap-6">
          <div className="h-[270px] w-[480px] shrink-0 overflow-hidden rounded-lg bg-zinc-800 ring-4 ring-white">
            {video.thumbnailUrl && (
              <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-end pb-4">
            <h2 className="text-4xl font-bold">{video.title || "Video title"}</h2>
            <p className="mt-2 text-xl text-zinc-400">{video.channelName}</p>
            <p className="mt-4 line-clamp-2 max-w-2xl text-lg text-zinc-500">{video.description}</p>
          </div>
        </div>
        <div className="mt-12 flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-[180px] w-[320px] shrink-0 rounded-lg bg-zinc-800",
                i === 0 && "opacity-50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PreviewTabsProps {
  video: PreviewVideoData;
  activeTab: "desktop-watch" | "desktop-search" | "mobile" | "tv";
  onTabChange: (tab: "desktop-watch" | "desktop-search" | "mobile" | "tv") => void;
}

export function PreviewTabs({ video, activeTab, onTabChange }: PreviewTabsProps) {
  const tabs = [
    { id: "desktop-watch" as const, label: "Desktop" },
    { id: "desktop-search" as const, label: "Search" },
    { id: "mobile" as const, label: "Mobile" },
    { id: "tv" as const, label: "TV" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="overflow-auto rounded-xl border border-border bg-muted/20 p-4">
        {activeTab === "desktop-watch" && <DesktopWatchPreview video={video} />}
        {activeTab === "desktop-search" && <DesktopSearchPreview video={video} />}
        {activeTab === "mobile" && <MobileWatchPreview video={video} />}
        {activeTab === "tv" && (
          <div style={{ width: 960, height: 540, overflow: "hidden" }}>
            <TvBrowsePreview video={video} />
          </div>
        )}
      </div>
    </div>
  );
}
