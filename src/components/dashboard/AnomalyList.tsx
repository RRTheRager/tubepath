"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import type { Anomaly } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataNotice } from "@/components/ui/DataNotice";

export function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
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

  return (
    <Card>
      <CardHeader
        title="Spikes & anomalies"
        subtitle="Unusual days worth a closer look"
      />
      {anomalies.length === 0 ? (
        <DataNotice
          title="No anomalies detected"
          description="When your channel has enough history, unusual spikes and dips will show up here."
        />
      ) : (
        <div className="space-y-2">
          {anomalies.map((a) => {
            const id = `${a.metric}-${a.date}`;
            const up = a.direction === "spike";
            return (
              <div key={id} className="rounded-lg border border-border">
                <button
                  onClick={() => explain(a)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      up ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">
                      {a.metric} {a.direction} &middot; {a.date}
                    </p>
                    {a.videoTitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {a.videoTitle}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {Math.abs(a.zScore)}σ
                  </span>
                </button>

                <AnimatePresence>
                  {openId === id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-3 text-sm text-muted-foreground">
                        {loadingId === id ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                          </span>
                        ) : (
                          explanation[id]
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
