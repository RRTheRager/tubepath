"use client";

import type { InsightCard } from "@tubepath/core";
import { MessageCircle, Eye, Sparkles, Users, GitBranch } from "lucide-react";
import { cn } from "../lib/cn";

const ICONS = {
  engagement: MessageCircle,
  views: Eye,
  general: Sparkles,
  competitor: Users,
  pipeline: GitBranch,
};

interface InsightFeedProps {
  cards: InsightCard[];
  className?: string;
  onCardClick?: (card: InsightCard) => void;
}

export function InsightFeed({ cards, className, onCardClick }: InsightFeedProps) {
  if (cards.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border/50 bg-card/40 p-6 text-center", className)}>
        <p className="text-sm text-muted-foreground">Sync your channel to get AI insights.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">Insights for you</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {cards.map((card) => {
          const Icon = ICONS[card.type] ?? Sparkles;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onCardClick?.(card)}
              className={cn(
                "min-w-[280px] max-w-[320px] flex-shrink-0 snap-start rounded-xl border border-border/50 bg-card/60 p-4 text-left backdrop-blur-md transition hover:border-primary/30",
                card.priority === "high" && "border-primary/20"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {card.type}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{card.summary}</p>
              {card.detail && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{card.detail}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
