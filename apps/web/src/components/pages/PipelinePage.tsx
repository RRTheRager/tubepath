"use client";

import type { PipelineEdge, PipelineNode } from "@tubepath/core";
import { PipelineGraph, UpgradeCta } from "@tubepath/ui";
import { useEffect, useState } from "react";

export function PipelinePage() {
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [edges, setEdges] = useState<PipelineEdge[]>([]);
  const [tier, setTier] = useState<"free" | "pro">("free");

  useEffect(() => {
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((d) => {
        setNodes(d.nodes ?? []);
        setEdges(d.edges ?? []);
        setTier(d.tier ?? "free");
      });
  }, []);

  const handleAddUrl = async (url: string) => {
    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const d = await res.json();
    if (d.nodes) setNodes(d.nodes);
    if (d.edges) setEdges(d.edges);
  };

  if (tier !== "pro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Inspiration Pipeline</h1>
        <p className="text-muted-foreground">
          Trace your creative lineage from competitor videos and notes to your uploads.
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
      <h1 className="text-2xl font-bold">Inspiration Pipeline</h1>
      <p className="text-sm text-muted-foreground">
        Map how competitor content and ideas led to your videos.
      </p>
      <PipelineGraph
        nodes={nodes}
        edges={edges}
        onAddUrl={handleAddUrl}
      />
    </div>
  );
}
