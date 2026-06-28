"use client";

import {
  Activity,
  GitBranch,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { cn } from "../lib/cn";

export type NavItem = "pulse" | "videos" | "competitors" | "pipeline" | "optimize" | "settings";

interface SidebarProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  isPro?: boolean;
  className?: string;
}

const NAV: { id: NavItem; label: string; icon: typeof Activity; proOnly?: boolean }[] = [
  { id: "pulse", label: "Pulse", icon: Activity },
  { id: "videos", label: "Videos", icon: Video },
  { id: "competitors", label: "Competitors", icon: Users, proOnly: true },
  { id: "pipeline", label: "Pipeline", icon: GitBranch, proOnly: true },
  { id: "optimize", label: "Optimize", icon: Sparkles, proOnly: true },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active, onNavigate, isPro, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-56 flex-col border-r border-border/50 bg-card/30 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-4">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="font-bold text-foreground">TubePath</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map((item) => {
          const locked = item.proOnly && !isPro;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !locked && onNavigate(item.id)}
              disabled={locked}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                locked && "cursor-not-allowed opacity-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {locked && (
                <span className="ml-auto text-[10px] uppercase text-primary">Pro</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
