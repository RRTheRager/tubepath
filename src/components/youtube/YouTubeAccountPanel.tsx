"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Plus,
  RefreshCw,
  User,
  Users,
  X,
} from "lucide-react";
import type { GoogleAccountSummary, YouTubeChannelLink } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface YouTubeAccountPanelProps {
  variant?: "sidebar" | "full";
}

export function YouTubeAccountPanel({
  variant = "sidebar",
}: YouTubeAccountPanelProps) {
  const { data, refresh } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccountSummary[]>(
    data?.googleAccounts ?? []
  );
  const [channels, setChannels] = useState<YouTubeChannelLink[]>(
    data?.account.youtubeChannels ?? []
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const activeGoogleId = data?.activeGoogleAccountId;
  const activeGoogle =
    googleAccounts.find((g) => g.id === activeGoogleId) ?? googleAccounts[0];
  const activeChannelId = data?.account.youtubeChannelId;
  const activeChannel =
    channels.find((c) => c.id === activeChannelId) ??
    channels.find((c) => c.role === "manager") ??
    channels[0];

  useEffect(() => {
    setGoogleAccounts(data?.googleAccounts ?? []);
    setChannels(data?.account.youtubeChannels ?? []);
  }, [data?.googleAccounts, data?.account.youtubeChannels]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const reload = useCallback(async () => {
    await refresh();
    router.refresh();
  }, [refresh, router]);

  const refreshChannels = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/youtube/channels", { cache: "no-store" });
      const json = (await res.json()) as { channels: YouTubeChannelLink[] };
      setChannels(json.channels ?? []);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const switchGoogle = async (googleAccountId: string) => {
    if (googleAccountId === activeGoogleId) return;
    setBusy(true);
    try {
      await fetch("/api/google/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAccountId }),
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const switchChannel = async (channelId: string) => {
    if (channelId === activeChannelId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/youtube/switch-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      await reload();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const disconnectGoogle = async (googleAccountId: string) => {
    setBusy(true);
    try {
      await fetch("/api/google/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAccountId, action: "disconnect" }),
      });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  if (!data?.account.youtubeConnected && googleAccounts.length === 0) {
    return null;
  }

  if (variant === "full") {
    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Google accounts</h3>
            <a href="/api/auth/google?add=1">
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" /> Add account
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            {googleAccounts.map((g) => (
              <div
                key={g.id}
                className={cn(
                  "flex min-w-[220px] flex-1 items-center gap-3 rounded-xl border p-3 transition-colors",
                  g.id === activeGoogleId
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => switchGoogle(g.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <GoogleAvatar account={g} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {g.email}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {g.channelCount} channel{g.channelCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  title="Remove"
                  disabled={busy}
                  onClick={() => disconnectGoogle(g.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">YouTube channel</h3>
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                disabled={busy}
                onClick={() => switchChannel(ch.id)}
                className={cn(
                  "flex min-w-[200px] flex-1 items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  ch.id === activeChannelId
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <ChannelAvatar channel={ch} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ch.title}</p>
                  <RoleBadge role={ch.role} />
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refreshChannels}
            disabled={busy}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
            Refresh channel list
          </button>
        </section>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative mx-3 mb-4">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border/60 bg-card/40 p-2 text-left transition-colors hover:bg-card/70"
      >
        {activeChannel ? (
          <ChannelAvatar channel={activeChannel} size="sm" />
        ) : activeGoogle ? (
          <GoogleAvatar account={activeGoogle} size="sm" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
            ?
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {activeChannel?.title ?? activeGoogle?.name ?? "Select account"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {activeGoogle?.email ?? "YouTube"}
            {activeChannel &&
              ` · ${activeChannel.role === "manager" ? "Managed" : "Owned"}`}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-app-lg">
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Google accounts
          </p>
          {googleAccounts.map((g) => (
            <button
              key={g.id}
              type="button"
              disabled={busy}
              onClick={() => switchGoogle(g.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                g.id === activeGoogleId
                  ? "bg-primary/12 text-primary"
                  : "hover:bg-muted/60"
              )}
            >
              <GoogleAvatar account={g} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {g.email}
                </p>
              </div>
            </button>
          ))}
          <a
            href="/api/auth/google?add=1"
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-primary hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add Google account
          </a>

          {channels.length > 0 && (
            <>
              <div className="my-1 border-t border-border" />
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Channels
              </p>
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  disabled={busy}
                  onClick={() => switchChannel(ch.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                    ch.id === activeChannelId
                      ? "bg-primary/12 text-primary"
                      : "hover:bg-muted/60"
                  )}
                >
                  <ChannelAvatar channel={ch} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ch.title}</p>
                    <RoleBadge role={ch.role} compact />
                  </div>
                </button>
              ))}
            </>
          )}

          <button
            type="button"
            onClick={refreshChannels}
            disabled={busy}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleAvatar({
  account,
  size = "md",
}: {
  account: GoogleAccountSummary;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  if (account.pictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={account.pictureUrl}
        alt=""
        className={cn(dim, "rounded-full object-cover")}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        "flex items-center justify-center rounded-full bg-muted text-sm font-bold"
      )}
    >
      {account.name.slice(0, 1)}
    </div>
  );
}

function ChannelAvatar({
  channel,
  size = "md",
}: {
  channel: YouTubeChannelLink;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  if (channel.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={channel.thumbnailUrl}
        alt=""
        className={cn(dim, "rounded-full object-cover")}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        "flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white"
      )}
    >
      {channel.title.slice(0, 1)}
    </div>
  );
}

function RoleBadge({
  role,
  compact,
}: {
  role: YouTubeChannelLink["role"];
  compact?: boolean;
}) {
  const isManager = role === "manager";
  if (compact) {
    return (
      <span className="text-[11px] text-muted-foreground">
        {isManager ? "Manager" : "Owner"}
      </span>
    );
  }
  return (
    <Badge tone={isManager ? "primary" : "neutral"} className="mt-1">
      {isManager ? (
        <>
          <Users className="h-3 w-3" /> Manager
        </>
      ) : (
        <>
          <User className="h-3 w-3" /> Owner
        </>
      )}
    </Badge>
  );
}
