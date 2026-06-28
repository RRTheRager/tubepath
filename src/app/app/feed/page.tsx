"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { InsightCard, OverviewPayload } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { PulseHero } from "@/components/feed/PulseHero";
import { FeedCard } from "@/components/feed/FeedCard";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";

export default function FeedPage() {
  const { data: session, refresh } = useSession();
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [aiInsights, setAiInsights] = useState<InsightCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isFull = session?.capabilities.level === "full";

  const load = useCallback(async () => {
    const res = await fetch("/api/overview", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setOverview(json.overview);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isFull) {
      fetch("/api/ai/insights", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setAiInsights(j.insights))
        .catch(() => {});
    }
  }, [isFull]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  if (loading || !overview) return <Loading label="Loading your pulse" />;

  const cards = isFull && aiInsights?.length ? aiInsights : overview.insights;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">For You</h1>
        <p className="text-sm text-muted-foreground">
          Your daily creator briefing
        </p>
      </div>

      <PulseHero
        pulse={overview.pulse}
        channelTitle={overview.channel.title}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {cards.map((card, i) => (
        <FeedCard key={card.id} card={card} index={i} />
      ))}

      {!isFull && <UnlockAiCard onUnlock={refresh} />}
    </div>
  );
}

function UnlockAiCard({ onUnlock }: { onUnlock: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const unlock = async () => {
    setBusy(true);
    const res = await fetch("/api/billing/activate-now", { method: "POST" });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else await onUnlock();
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mac-card border-primary/30 bg-gradient-to-br from-primary/10 to-transparent text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">Your AI feed is waiting</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        These are canned highlights. Premium turns this into a personalized,
        AI-generated feed that learns what moves your channel.
      </p>
      <Button className="mt-4" onClick={unlock} disabled={busy}>
        <Sparkles className="h-4 w-4" /> Unlock AI insights
      </Button>
    </motion.div>
  );
}
