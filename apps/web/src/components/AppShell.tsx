"use client";

import { Sidebar, type NavItem } from "@tubepath/ui";
import { ChannelSwitcher } from "@tubepath/ui";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ChannelSummary, SubscriptionTier } from "@tubepath/core";

const ROUTES: Record<NavItem, string> = {
  pulse: "/app/pulse",
  videos: "/app/videos",
  competitors: "/app/competitors",
  pipeline: "/app/pipeline",
  optimize: "/app/optimize",
  settings: "/app/settings",
};

function pathToNav(pathname: string): NavItem {
  if (pathname.includes("/videos")) return "videos";
  if (pathname.includes("/competitors")) return "competitors";
  if (pathname.includes("/pipeline")) return "pipeline";
  if (pathname.includes("/optimize")) return "optimize";
  if (pathname.includes("/settings")) return "settings";
  return "pulse";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        setTier(data.tier ?? "free");
        setChannels(data.channels ?? []);
        setActiveChannelId(data.activeChannelId ?? data.channels?.[0]?.id ?? "");
      })
      .catch(() => {});
  }, []);

  const handleNavigate = useCallback(
    (item: NavItem) => {
      router.push(ROUTES[item]);
    },
    [router]
  );

  const handleChannelSelect = useCallback(async (channelId: string) => {
    setActiveChannelId(channelId);
    await fetch("/api/channels/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active={pathToNav(pathname)}
        onNavigate={handleNavigate}
        isPro={tier === "pro"}
        className="hidden md:flex"
      />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/50 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            {channels.length > 0 && (
              <ChannelSwitcher
                channels={channels}
                activeChannelId={activeChannelId}
                onSelect={handleChannelSelect}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {tier === "free" && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Free
              </span>
            )}
            {tier === "pro" && (
              <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                Pro
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-6 md:p-6">{children}</main>
        <MobileNav pathname={pathname} tier={tier} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

function MobileNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  tier: "free" | "pro";
  onNavigate: (item: NavItem) => void;
}) {
  const items: { id: NavItem; label: string }[] = [
    { id: "pulse", label: "Pulse" },
    { id: "videos", label: "Videos" },
    { id: "optimize", label: "Optimize" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t border-border/50 bg-card/90 backdrop-blur-md md:hidden">
      {items.map((item) => {
        const active = pathToNav(pathname) === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 py-3 text-xs font-medium ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
