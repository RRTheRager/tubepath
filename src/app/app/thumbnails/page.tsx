"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Monitor, Smartphone, Tv, Upload } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";

type PreviewImage = { url: string; label: string };

function PreviewFrame({
  title,
  icon: Icon,
  imageUrl,
  variant,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  imageUrl: string | null;
  variant: "home" | "search" | "suggested";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-lg bg-[#0f0f0f]",
          variant === "home" && "aspect-video w-full",
          variant === "search" && "flex gap-2 p-2",
          variant === "suggested" && "flex gap-2 p-2"
        )}
      >
        {variant === "home" && (
          <>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/40">
                Upload a thumbnail
              </div>
            )}
            <div className="bg-[#0f0f0f] px-2 py-1.5">
              <div className="h-2 w-3/4 rounded bg-white/20" />
              <div className="mt-1 h-1.5 w-1/2 rounded bg-white/10" />
            </div>
          </>
        )}
        {(variant === "search" || variant === "suggested") && (
          <>
            <div
              className={cn(
                "shrink-0 overflow-hidden rounded-md bg-white/10",
                variant === "search" ? "h-16 w-28" : "h-14 w-24"
              )}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
              <div className="h-2 w-full rounded bg-white/20" />
              <div className="h-1.5 w-2/3 rounded bg-white/10" />
              {variant === "search" && (
                <div className="h-1.5 w-1/2 rounded bg-white/10" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ThumbnailsPage() {
  const { data: session, loading } = useSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setFileName(file.name);
  }, []);

  const loadCurrent = useCallback(async () => {
    const res = await fetch("/api/videos", { cache: "no-store" });
    const json = await res.json();
    const thumb = json.videos?.[0]?.thumbnailUrl;
    if (thumb) {
      setImageUrl(thumb);
      setFileName("Current live thumbnail");
    }
  }, []);

  if (loading) return <Loading />;

  const placements: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "home" | "search" | "suggested";
  }[] = [
    { title: "Home feed", icon: Monitor, variant: "home" },
    { title: "Search results", icon: Smartphone, variant: "search" },
    { title: "Suggested sidebar", icon: Monitor, variant: "suggested" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ImageIcon className="h-6 w-6 text-primary" /> Thumbnail Previewer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview how your thumbnail looks across common YouTube placements. Free
          for all users — publishing to YouTube coming later.
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
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4" /> Mobile
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {placements.map((p) => (
            <PreviewFrame key={`m-${p.title}`} {...p} imageUrl={imageUrl} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Monitor className="h-4 w-4" /> Desktop
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {placements.map((p) => (
            <PreviewFrame key={`d-${p.title}`} {...p} imageUrl={imageUrl} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Tv className="h-4 w-4" /> TV / large screen
        </h2>
        <div className="max-w-xl">
          <PreviewFrame
            title="Home hero card"
            icon={Tv}
            variant="home"
            imageUrl={imageUrl}
          />
        </div>
      </div>
    </div>
  );
}
