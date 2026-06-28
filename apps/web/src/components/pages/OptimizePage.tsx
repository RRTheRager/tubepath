"use client";

import type { DescriptionSuggestion, TagSuggestion, TitleOption } from "@tubepath/core";
import { PreviewTabs, UpgradeCta, type PreviewVideoData } from "@tubepath/ui";
import { useEffect, useState } from "react";

export function OptimizePage() {
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [title, setTitle] = useState("How I Grew My Channel to 10K Subs");
  const [description, setDescription] = useState(
    "In this video I break down exactly what worked for my YouTube growth..."
  );
  const [tags, setTags] = useState<string[]>(["youtube growth", "creator tips"]);
  const [titles, setTitles] = useState<TitleOption[]>([]);
  const [descSuggestion, setDescSuggestion] = useState<DescriptionSuggestion | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [previewTab, setPreviewTab] = useState<
    "desktop-watch" | "desktop-search" | "mobile" | "tv"
  >("desktop-watch");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setTier(d.tier ?? "free"));
  }, []);

  const previewVideo: PreviewVideoData = {
    title,
    description,
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    channelName: "Demo Creator Channel",
    views: "12,400 views",
    publishedAt: "2 days ago",
  };

  const runOptimize = async (type: "title" | "description" | "tags" | "hook") => {
    setLoading(true);
    const res = await fetch("/api/ai/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description, tags }),
    });
    const d = await res.json();
    if (d.titles) setTitles(d.titles);
    if (d.description) setDescSuggestion(d.description);
    if (d.tags) setTagSuggestions(d.tags);
    setLoading(false);
  };

  const applyToYouTube = async () => {
    if (tier !== "pro") return;
    await fetch("/api/videos/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: "demo-v1",
        title,
        description,
        tags,
      }),
    });
    alert("Applied to YouTube (demo)");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">Optimize</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tags</label>
            <input
              value={tags.join(", ")}
              onChange={(e) => setTags(e.target.value.split(",").map((t) => t.trim()))}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["title", "description", "tags", "hook"] as const).map((type) => (
              <button
                key={type}
                type="button"
                disabled={loading}
                onClick={() => runOptimize(type)}
                className="rounded-lg bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/30"
              >
                AI {type}
              </button>
            ))}
          </div>
          {titles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Title suggestions</p>
              {titles.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTitle(t.text)}
                  className="block w-full rounded-lg border border-border/50 bg-card/40 p-3 text-left text-sm hover:border-primary/30"
                >
                  <p className="font-medium">{t.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.rationale}</p>
                </button>
              ))}
            </div>
          )}
          {descSuggestion && (
            <div className="rounded-lg border border-border/50 bg-card/40 p-3 text-sm">
              <p className="font-semibold">Suggested description</p>
              <p className="mt-2 whitespace-pre-wrap">{descSuggestion.hook}</p>
              <p className="mt-2 whitespace-pre-wrap">{descSuggestion.body}</p>
            </div>
          )}
          {tagSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagSuggestions.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => setTags([...tags, t.tag])}
                  className="rounded-full bg-muted px-3 py-1 text-xs"
                >
                  {t.tag}
                </button>
              ))}
            </div>
          )}
          {tier === "pro" ? (
            <button
              type="button"
              onClick={applyToYouTube}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Apply to YouTube
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Preview only on Free — upgrade to apply changes via API.
            </p>
          )}
        </div>

        <div>
          {tier === "pro" ? (
            <PreviewTabs
              video={previewVideo}
              activeTab={previewTab}
              onTabChange={setPreviewTab}
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Previews available on Pro. Upgrade to see desktop, mobile, and TV layouts.
              </p>
              <UpgradeCta
                onUpgrade={async () => {
                  const res = await fetch("/api/stripe/checkout", { method: "POST" });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
