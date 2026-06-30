"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { InsightCard, OverviewPayload } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { useActivatePremium } from "@/components/access/useActivatePremium";
import { PulseHero } from "@/components/feed/PulseHero";
import { FeedCard } from "@/components/feed/FeedCard";
import { Loading } from "@/components/ui/Loading";
import { AiSummaryLoading } from "@/components/ui/AiSummaryLoading";
import { Button } from "@/components/ui/Button";
import { DataNotice } from "@/components/ui/DataNotice";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { AI_SUPPORT_MESSAGE } from "@/lib/ai/constants";

export default function FeedPage() {
  const { data: session } = useSession();
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [aiInsights, setAiInsights] = useState<InsightCard[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isFull = session?.capabilities.level === "full";

  const load = useCallback(async () => {
    const res = await fetch("/api/overview", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.youtubeConnected && json.overview) {
        setOverview(json.overview);
      } else {
        setOverview(null);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (hasChannel) load();
    else setLoading(false);
  }, [hasChannel, load]);

  useEffect(() => {
    if (!isFull || !hasChannel) {
      setAiInsights(null);
      setAiError(null);
      setAiLoading(false);
      return;
    }

    setAiLoading(true);
    setAiInsights(null);
    setAiError(null);
    fetch("/api/ai/insights", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setAiInsights(j.insights ?? []);
        setAiError(j.error ?? null);
      })
      .catch(() => setAiError(AI_SUPPORT_MESSAGE))
      .finally(() => setAiLoading(false));
  }, [isFull, hasChannel]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  if (ytLoading || (hasChannel && loading)) {
    return <Loading label="Loading your pulse" />;
  }

  if (!hasChannel) {
    return <YouTubeConnectPrompt variant="select-channel" />;
  }

  if (!overview) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t load your channel data. Try reconnecting Google in
          Settings.
        </p>
      </div>
    );
  }

  const cards =
    isFull && aiLoading
      ? null
      : isFull && aiInsights?.length
        ? aiInsights
        : isFull && aiError
          ? [
              {
                id: "ai-error",
                tone: "neutral" as const,
                emoji: "⚠️",
                headline: "AI unavailable",
                detail: aiError,
                ai: false,
              },
            ]
          : overview.insights;

  return (
    <div className="feed-scroll space-y-4 animate-fade-in">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Insights</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Your daily creator briefing
        </p>
      </div>

      <PulseHero
        pulse={overview.pulse}
        channelTitle={overview.channel.title}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {isFull && aiLoading ? (
        <AiSummaryLoading label="Generating your daily insights…" compact />
      ) : cards && cards.length > 0 ? (
        cards.map((card, i) => <FeedCard key={card.id} card={card} index={i} />)
      ) : (
        <DataNotice
          title="No insights yet"
          description={
            isFull
              ? "There isn't enough recent activity for the AI to summarize. Check back after your next uploads pick up views."
              : "Connect your channel and upload a few videos — daily insights will show up here once there's data to work with."
          }
        />
      )}

      {!isFull && <UnlockAiCard />}
    </div>
  );
}

function UnlockAiCard() {
  const { activate, busy } = useActivatePremium();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="app-card border-primary/30 bg-gradient-to-br from-primary/10 to-transparent text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">Your AI feed is waiting</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Upgrade to Premium for a personalized, AI-generated feed tuned to your
        channel.
      </p>
      <Button className="mt-4" onClick={activate} disabled={busy}>
        <Sparkles className="h-4 w-4" /> Unlock AI insights
      </Button>
    </motion.div>
  );
}
