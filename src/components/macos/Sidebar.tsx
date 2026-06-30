"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Moon, Search, Sun, Flame } from "lucide-react";
import { NAV } from "./nav";
import { useSession } from "@/components/providers/SessionProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { YouTubeAccountPanel } from "@/components/youtube/YouTubeAccountPanel";
import { TubePathLogo } from "@/components/ui/TubePathLogo";
import { cn } from "@/lib/utils";

export function Sidebar({
  onOpenPalette,
  className,
  onNavigate,
}: {
  onOpenPalette: () => void;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data } = useSession();
  const { resolved, setMode } = useTheme();

  const isFull = data?.capabilities.level === "full";
  const trialing = data?.account.status === "trialing";

  return (
    <aside
      className={cn(
        "vibrancy relative flex w-[min(18rem,85vw)] shrink-0 flex-col border-r border-border/60",
        className
      )}
    >
      <div className="flex h-12 items-center px-4">
        <TubePathLogo href="/app/feed" size={32} showWordmark />
      </div>

      <button
        onClick={onOpenPalette}
        className="mx-3 mb-3 flex h-9 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-card"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          Ctrl+K
        </kbd>
      </button>

      {(data?.account.youtubeConnected || (data?.googleAccounts?.length ?? 0) > 0) ? (
        <YouTubeAccountPanel variant="sidebar" />
      ) : (
        data?.account && (
          <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-lg p-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
              {data.account.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{data.account.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="h-3 w-3 text-warning" />
                {data.account.streak}-day streak
              </p>
            </div>
          </div>
        )
      )}

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const locked = item.premium && !isFull;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "tap-target group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
              <span className="flex-1">{item.label}</span>
              {locked && <Lock className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 p-3">
        {trialing && (
          <TrialMini daysLeft={data?.trialDaysLeft ?? 0} onNavigate={onNavigate} />
        )}

        <button
          onClick={() => setMode(resolved === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {resolved === "dark" ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
          {resolved === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}

function TrialMini({
  daysLeft,
  onNavigate,
}: {
  daysLeft: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/app/settings"
      onClick={onNavigate}
      className="block rounded-lg border border-primary/30 bg-primary/10 p-3 transition-colors hover:bg-primary/15"
    >
      <p className="text-xs font-semibold text-primary">
        {daysLeft} day{daysLeft === 1 ? "" : "s"} left in trial
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Unlock AI + advanced analytics
      </p>
    </Link>
  );
}
