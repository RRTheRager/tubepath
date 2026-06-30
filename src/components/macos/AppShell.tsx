"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { TrialBanner } from "@/components/access/TrialBanner";
import { GoogleConnectGate } from "@/components/youtube/GoogleConnectGate";
import { NAV } from "./nav";
import { cn } from "@/lib/utils";

const MOBILE_TABS = NAV.filter((n) =>
  ["feed", "dashboard", "analytics", "videos"].includes(n.id)
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeNav =
    NAV.find(
      (item) =>
        pathname === item.href || pathname.startsWith(item.href + "/")
    ) ?? null;

  return (
    <GoogleConnectGate>
      <div className="relative flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar
        onOpenPalette={() => setPaletteOpen(true)}
        className="relative hidden md:flex"
      />

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <Sidebar
            onOpenPalette={() => {
              setMenuOpen(false);
              setPaletteOpen(true);
            }}
            onNavigate={() => setMenuOpen(false)}
            className="fixed inset-y-0 left-0 z-50 shadow-app-lg md:hidden"
          />
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="vibrancy flex h-12 shrink-0 items-center gap-3 border-b border-border/60 px-3 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted/60"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">
              {activeNav?.label ?? "TubePath"}
            </p>
          </div>
          <Link
            href="/app/settings"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60",
              pathname.startsWith("/app/settings")
                ? "text-primary"
                : "text-muted-foreground"
            )}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        <TrialBanner />
        <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-8">
            {children}
          </div>
        </main>

        <nav className="vibrancy fixed bottom-0 left-0 right-0 z-30 flex gap-0.5 border-t border-border/60 px-1 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden">
          {MOBILE_TABS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "tap-target flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground active:bg-muted/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2.1} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </GoogleConnectGate>
  );
}
