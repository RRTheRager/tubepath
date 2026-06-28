"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import type { SuggestionBundle } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { PremiumGate } from "@/components/access/PremiumGate";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { Loading } from "@/components/ui/Loading";

export default function SuggestionsPage() {
  const { data: session, loading } = useSession();
  const [topic, setTopic] = useState("");
  const [bundle, setBundle] = useState<SuggestionBundle | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;

  if (!session?.capabilities.ai) {
    return (
      <PremiumGate
        title="AI Studio is a Premium feature"
        description="Generate scroll-stopping titles, descriptions, tags, and hooks tuned to your channel."
        perks={[
          "High-CTR title variations with rationale",
          "SEO descriptions with timestamps",
          "Tag sets ranked by relevance & competition",
          "Hook scripts engineered for retention",
        ]}
      />
    );
  }

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const json = await res.json();
      setBundle(json.bundle);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Wand2 className="h-6 w-6 text-primary" /> AI Studio
        </h1>
        <p className="text-sm text-muted-foreground">
          Describe your next video and get a full optimization pack.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && generate()}
            placeholder="e.g. how I edit videos 2x faster"
            className="h-11 flex-1 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={generate} disabled={busy} size="md">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>
        {!session.aiConfigured && (
          <p className="mt-2 text-xs text-muted-foreground">
            Demo mode: add a Gemini API key for live generation. Showing curated
            examples for now.
          </p>
        )}
      </Card>

      {busy && <Loading label="Generating your pack" />}

      {bundle && !busy && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Titles */}
          <Card>
            <CardHeader title="Title options" subtitle="Ranked by predicted CTR" />
            <div className="space-y-2.5">
              {bundle.titles.map((t, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{t.text}</p>
                    <Badge tone={t.ctrScore >= 82 ? "success" : "primary"}>
                      {t.ctrScore}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.rationale}
                  </p>
                  <div className="mt-1.5">
                    <CopyButton text={t.text} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader
              title="Description"
              action={
                <CopyButton
                  text={`${bundle.description.hook}\n\n${bundle.description.body}\n\n${bundle.description.cta}\n\n${bundle.description.hashtags.join(" ")}`}
                />
              }
            />
            <p className="text-sm font-medium">{bundle.description.hook}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {bundle.description.body}
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              {bundle.description.cta}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bundle.description.hashtags.map((h) => (
                <Badge key={h} tone="primary">
                  {h}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader
              title="Tags"
              action={
                <CopyButton text={bundle.tags.map((t) => t.tag).join(", ")} />
              }
            />
            <div className="flex flex-wrap gap-2">
              {bundle.tags.map((t) => (
                <span
                  key={t.tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
                >
                  {t.tag}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      t.competition === "low"
                        ? "bg-success"
                        : t.competition === "medium"
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    title={`${t.competition} competition`}
                  />
                </span>
              ))}
            </div>
          </Card>

          {/* Hook */}
          <Card>
            <CardHeader title="Hook script" subtitle="First 30 seconds" />
            <p className="rounded-lg bg-muted/60 p-3 text-sm italic">
              &ldquo;{bundle.hook.script}&rdquo;
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {bundle.hook.retentionTactics.map((tactic) => (
                <li key={tactic} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {tactic}
                </li>
              ))}
            </ul>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader title="Growth tips" />
            <div className="space-y-2.5">
              {bundle.tips.map((tip) => (
                <div key={tip.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{tip.title}</p>
                    <Badge
                      tone={
                        tip.priority === "high"
                          ? "danger"
                          : tip.priority === "medium"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {tip.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{tip.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
