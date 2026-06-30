"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import type { Anomaly } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataNotice } from "@/components/ui/DataNotice";

export function AnomalyList({
  anomalies,
  periodDays,
}: {
  anomalies: Anomaly[];
  periodDays?: number;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const explain = async (a: Anomaly) => {
    const id = `${a.metric}-${a.date}`;
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (explanation[id]) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Explain the ${a.metric} ${a.direction} on ${a.date}${a.videoTitle ? ` driven by "${a.videoTitle}"` : ""} and how to repeat or fix it.`,
        }),
      });
      const json = await res.json();
      setExplanation((e) => ({ ...e, [id]: json.content ?? "No explanation available." }));
    } catch {
      setExplanation((e) => ({ ...e, [id]: "Couldn't load an explanation." }));
    } finally {
      setLoadingId(null);
    }
  };

  if (!anomalies.length) {
    return (
      <Card className="p-6">
        <CardHeader
          title="Spikes & anomalies"
          subtitle={
            periodDays
              ? `Last ${periodDays} days · unusual changes in your metrics`
              : "Unusual changes in your metrics"
          }
        />
        <DataNotice
          className="py-8"
          title="No spikes detected"
          description="Nothing unusual stood out in this period. We'll flag significant view or engagement changes here."
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader
        title="Spikes & anomalies"
        subtitle={
          periodDays
            ? `Last ${periodDays} days · ${anomalies.length} unusual change${anomalies.length === 1 ? "" : "s"}`
            : `${anomalies.length} unusual change${anomalies.length === 1 ? "" : "s"} in this period`
        }
      />
      <div className="space-y-2">
        {anomalies.map((a) => {
          const id = `${a.metric}-${a.date}`;
          const open = openId === id;
          const Icon = a.direction === "spike" ? ArrowUpRight : ArrowDownRight;

          return (
            <div key={id} className="rounded-lg border border-border">
              <button
                type="button"
                onClick={() => explain(a)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    a.direction === "spike"
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">
                    {a.metric} {a.direction}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.date}
                    {a.videoTitle ? ` · ${a.videoTitle}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  z={a.zScore}
                </span>
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="flex items-start gap-2 px-4 py-3 text-sm text-muted-foreground">
                      {loadingId === id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )}
                      <p className="leading-relaxed">
                        {explanation[id] ?? "Loading explanation…"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
