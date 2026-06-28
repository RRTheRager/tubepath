"use client";

import { ChevronDown } from "lucide-react";
import type { ChannelSummary } from "@tubepath/core";
import { cn } from "../lib/cn";

interface ChannelSwitcherProps {
  channels: ChannelSummary[];
  activeChannelId?: string;
  onSelect: (channelId: string) => void;
  className?: string;
}

export function ChannelSwitcher({
  channels,
  activeChannelId,
  onSelect,
  className,
}: ChannelSwitcherProps) {
  const active = channels.find((c) => c.id === activeChannelId) ?? channels[0];

  return (
    <div className={cn("relative", className)}>
      <select
        value={active?.id ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none rounded-xl border border-border/50 bg-card/60 py-2 pl-3 pr-9 text-sm font-medium backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {channels.map((ch) => (
          <option key={ch.id} value={ch.id}>
            {ch.title}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {active?.thumbnailUrl && (
        <img
          src={active.thumbnailUrl}
          alt=""
          className="pointer-events-none absolute left-[-9999px] h-6 w-6 rounded-full"
        />
      )}
    </div>
  );
}
