"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Monitor, Smartphone, Upload } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import {
  PREVIEW_FRAMES,
  YOUTUBE_UPLOAD,
} from "@/lib/thumbnails/youtube-sizes";

type Layout = "home" | "list" | "shorts";

function ThumbnailImg({
  url,
  width,
  height,
}: {
  url: string | null;
  width: number;
  height: number;
}) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-md bg-white/10"
      style={{
        width: `min(100%, ${width}px)`,
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[40px] items-center justify-center px-1 text-center text-[10px] text-white/40">
          Upload
        </div>
      )}
    </div>
  );
}

function PreviewFrame({
  label,
  sizeLabel,
  imageUrl,
  layout,
  frame,
  wide = false,
}: {
  label: string;
  sizeLabel: string;
  imageUrl: string | null;
  layout: Layout;
  frame: { width: number; height: number };
  wide?: boolean;
}) {
  const mockupWidth = layout === "list" ? frame.width + 120 : frame.width;

  if (layout === "home") {
    return (
      <div
        className={`min-w-0 rounded-xl border border-border bg-card p-4 ${
          wide ? "sm:col-span-2" : ""
        }`}
      >
        <p className="mb-1 text-sm font-medium">{label}</p>
        <p className="mb-3 text-xs text-muted-foreground">{sizeLabel}</p>
        <div
          className="w-full max-w-full rounded-lg bg-[#0f0f0f] p-2"
          style={{ maxWidth: mockupWidth + 16 }}
        >
          <ThumbnailImg url={imageUrl} width={frame.width} height={frame.height} />
          <div
            className="mt-2 space-y-1.5"
            style={{ width: `min(100%, ${frame.width}px)` }}
          >
            <div className="h-2 w-3/4 rounded bg-white/20" />
            <div className="h-1.5 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (layout === "shorts") {
    return (
      <div className="min-w-0 rounded-xl border border-border bg-card p-4">
        <p className="mb-1 text-sm font-medium">{label}</p>
        <p className="mb-3 text-xs text-muted-foreground">{sizeLabel}</p>
        <div
          className="inline-flex max-w-full rounded-lg bg-[#0f0f0f] p-2"
          style={{ maxWidth: frame.width + 16 }}
        >
          <ThumbnailImg url={imageUrl} width={frame.width} height={frame.height} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <p className="mb-1 text-sm font-medium">{label}</p>
      <p className="mb-3 text-xs text-muted-foreground">{sizeLabel}</p>
      <div className="flex w-full max-w-full gap-2 rounded-lg bg-[#0f0f0f] p-2">
        <ThumbnailImg url={imageUrl} width={frame.width} height={frame.height} />
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="h-2 w-full rounded bg-white/20" />
          <div className="h-1.5 w-2/3 rounded bg-white/10" />
          <div className="h-1.5 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function ThumbnailsPage() {
  const { data: session, loading } = useSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setFileName(file.name);

    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const target = 16 / 9;
      if (Math.abs(ratio - target) > 0.08) {
        setSizeWarning(
          `Image is ${img.width}×${img.height}. YouTube recommends ${YOUTUBE_UPLOAD.label}.`
        );
      } else if (img.width < 1280) {
        setSizeWarning(
          `Width is ${img.width}px. YouTube recommends at least 1280px wide for best quality.`
        );
      } else {
        setSizeWarning(null);
      }
    };
    img.src = url;
  }, []);

  const loadCurrent = useCallback(async () => {
    const res = await fetch("/api/videos", { cache: "no-store" });
    const json = await res.json();
    const thumb = json.videos?.[0]?.thumbnailUrl;
    if (thumb) {
      setImageUrl(thumb);
      setFileName("Current live thumbnail");
      setSizeWarning(null);
    }
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ImageIcon className="h-6 w-6 text-primary" /> Thumbnail Previewer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview at YouTube&apos;s common display sizes. Upload{" "}
          {YOUTUBE_UPLOAD.label} for best results.
        </p>
      </div>

      <Card>
        <CardHeader title="Your thumbnail" />
        <div className="flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <Button onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload image
          </Button>
          {session?.account.youtubeConnected && (
            <Button variant="secondary" onClick={loadCurrent}>
              Use current thumbnail
            </Button>
          )}
        </div>
        {fileName && (
          <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>
        )}
        {sizeWarning && (
          <p className="mt-2 text-xs text-warning">{sizeWarning}</p>
        )}
      </Card>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4" /> Mobile
        </h2>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PreviewFrame
            label="Home feed"
            sizeLabel={`${PREVIEW_FRAMES.homeMobile.width}×${PREVIEW_FRAMES.homeMobile.height}px`}
            imageUrl={imageUrl}
            layout="home"
            frame={PREVIEW_FRAMES.homeMobile}
          />
          <PreviewFrame
            label="Search"
            sizeLabel={`${PREVIEW_FRAMES.searchMobile.width}×${PREVIEW_FRAMES.searchMobile.height}px`}
            imageUrl={imageUrl}
            layout="list"
            frame={PREVIEW_FRAMES.searchMobile}
          />
          <PreviewFrame
            label="Suggested"
            sizeLabel={`${PREVIEW_FRAMES.suggestedMobile.width}×${PREVIEW_FRAMES.suggestedMobile.height}px`}
            imageUrl={imageUrl}
            layout="list"
            frame={PREVIEW_FRAMES.suggestedMobile}
          />
          <PreviewFrame
            label="Shorts shelf"
            sizeLabel={`${PREVIEW_FRAMES.shortsMobile.width}×${PREVIEW_FRAMES.shortsMobile.height}px`}
            imageUrl={imageUrl}
            layout="shorts"
            frame={PREVIEW_FRAMES.shortsMobile}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Monitor className="h-4 w-4" /> Desktop
        </h2>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PreviewFrame
            label="Home feed"
            sizeLabel={`${PREVIEW_FRAMES.homeDesktop.width}×${PREVIEW_FRAMES.homeDesktop.height}px`}
            imageUrl={imageUrl}
            layout="home"
            frame={PREVIEW_FRAMES.homeDesktop}
            wide
          />
          <PreviewFrame
            label="Search"
            sizeLabel={`${PREVIEW_FRAMES.searchDesktop.width}×${PREVIEW_FRAMES.searchDesktop.height}px`}
            imageUrl={imageUrl}
            layout="list"
            frame={PREVIEW_FRAMES.searchDesktop}
          />
          <PreviewFrame
            label="Suggested sidebar"
            sizeLabel={`${PREVIEW_FRAMES.suggestedDesktop.width}×${PREVIEW_FRAMES.suggestedDesktop.height}px`}
            imageUrl={imageUrl}
            layout="list"
            frame={PREVIEW_FRAMES.suggestedDesktop}
          />
          <PreviewFrame
            label="Shorts shelf"
            sizeLabel={`${PREVIEW_FRAMES.shortsDesktop.width}×${PREVIEW_FRAMES.shortsDesktop.height}px`}
            imageUrl={imageUrl}
            layout="shorts"
            frame={PREVIEW_FRAMES.shortsDesktop}
          />
        </div>
      </section>
    </div>
  );
}
