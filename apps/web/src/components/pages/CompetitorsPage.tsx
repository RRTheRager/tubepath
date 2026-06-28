"use client";

import type { CompetitorChannel } from "@tubepath/core";
import { CompetitorComparison, UpgradeCta } from "@tubepath/ui";
import { useEffect, useState } from "react";

export function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorChannel[]>([]);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [channelInput, setChannelInput] = useState("");
  const [comparison, setComparison] = useState<{
    yourData: { date: string; value: number }[];
    competitorData: { date: string; value: number }[];
    competitor: CompetitorChannel;
  } | null>(null);

  useEffect(() => {
    fetch("/api/competitors")
      .then((r) => r.json())
      .then((d) => {
        setCompetitors(d.competitors ?? []);
        setTier(d.tier ?? "free");
        if (d.comparison) setComparison(d.comparison);
      });
  }, []);

  const handleAdd = async () => {
    if (!channelInput) return;
    const res = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: channelInput }),
    });
    const d = await res.json();
    if (d.competitors) setCompetitors(d.competitors);
    if (d.comparison) setComparison(d.comparison);
    setChannelInput("");
  };

  if (tier !== "pro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Competitors</h1>
        <p className="text-muted-foreground">
          Track up to 10 competitor channels and compare public stats side by side.
        </p>
        <UpgradeCta
          onUpgrade={async () => {
            const res = await fetch("/api/stripe/checkout", { method: "POST" });
            const { url } = await res.json();
            if (url) window.location.href = url;
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Competitors</h1>
      <div className="flex gap-2">
        <input
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          placeholder="YouTube channel URL or ID"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {competitors.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-4"
          >
            <img src={c.thumbnailUrl} alt="" className="h-12 w-12 rounded-full" />
            <div>
              <p className="font-semibold">{c.nickname || c.title}</p>
              <p className="text-xs text-muted-foreground">
                {c.subscriberCount.toLocaleString()} subs • Public data only
              </p>
            </div>
          </div>
        ))}
      </div>
      {comparison && (
        <CompetitorComparison
          yourData={comparison.yourData}
          competitor={comparison.competitor}
          competitorData={comparison.competitorData}
        />
      )}
    </div>
  );
}
