"use client";

import type { PipelineEdge, PipelineNode } from "@tubepath/core";
import { GitBranch, Link2, FileText, Video, Globe } from "lucide-react";
import { cn } from "../lib/cn";

const NODE_ICONS = {
  external_video: Globe,
  competitor_video: Video,
  note: FileText,
  draft: FileText,
  published_video: Video,
};

const NODE_COLORS = {
  external_video: "border-blue-500/50 bg-blue-500/10",
  competitor_video: "border-orange-500/50 bg-orange-500/10",
  note: "border-zinc-500/50 bg-zinc-500/10",
  draft: "border-yellow-500/50 bg-yellow-500/10",
  published_video: "border-green-500/50 bg-green-500/10",
};

interface PipelineGraphProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  onNodeClick?: (node: PipelineNode) => void;
  onAddUrl?: (url: string) => void;
  className?: string;
}

export function PipelineGraph({
  nodes,
  edges,
  onNodeClick,
  onAddUrl,
  className,
}: PipelineGraphProps) {
  const positioned = nodes.map((node, i) => ({
    ...node,
    x: node.id ? (i % 3) * 220 + 40 : 0,
    y: node.id ? Math.floor(i / 3) * 140 + 40 : 0,
  }));

  return (
    <div className={cn("space-y-4", className)}>
      {onAddUrl && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const url = String(fd.get("url") ?? "");
            if (url) onAddUrl(url);
            e.currentTarget.reset();
          }}
          className="flex gap-2"
        >
          <input
            name="url"
            type="url"
            placeholder="Paste YouTube URL for inspiration..."
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Add
          </button>
        </form>
      )}

      <div className="relative min-h-[400px] overflow-auto rounded-xl border border-border/50 bg-card/30 p-4">
        {nodes.length === 0 ? (
          <div className="flex h-[400px] flex-col items-center justify-center text-center">
            <GitBranch className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Start your inspiration trail</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Add competitor videos, notes, and links to trace how your content came to life.
            </p>
          </div>
        ) : (
          <>
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {edges.map((edge) => {
                const source = positioned.find((n) => n.id === edge.sourceId);
                const target = positioned.find((n) => n.id === edge.targetId);
                if (!source || !target) return null;
                const sx = (source as { x: number }).x + 100;
                const sy = (source as { y: number }).y + 40;
                const tx = (target as { x: number }).x + 100;
                const ty = (target as { y: number }).y + 40;
                return (
                  <line
                    key={edge.id}
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeOpacity={0.4}
                    markerEnd="url(#arrow)"
                  />
                );
              })}
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary))" opacity={0.6} />
                </marker>
              </defs>
            </svg>
            {positioned.map((node) => {
              const Icon = NODE_ICONS[node.type] ?? Link2;
              const pos = node as PipelineNode & { x: number; y: number };
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onNodeClick?.(node)}
                  style={{ left: pos.x, top: pos.y }}
                  className={cn(
                    "absolute w-[200px] rounded-xl border p-3 text-left transition hover:scale-105",
                    NODE_COLORS[node.type]
                  )}
                >
                  <div className="flex items-start gap-2">
                    {node.thumbnailUrl ? (
                      <img
                        src={node.thumbnailUrl}
                        alt=""
                        className="h-10 w-16 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-medium text-foreground">
                        {node.title}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                        {node.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
