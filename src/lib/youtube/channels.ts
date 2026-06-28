import type { YouTubeChannelLink } from "@/lib/types";
import { dataApi } from "@/lib/data/youtube-client";

interface ChannelListResponse {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      customUrl?: string;
      thumbnails?: { default?: { url?: string } };
    };
  }[];
}

function toLink(
  item: NonNullable<ChannelListResponse["items"]>[number],
  role: YouTubeChannelLink["role"]
): YouTubeChannelLink {
  return {
    id: item.id,
    title: item.snippet?.title ?? "Untitled channel",
    handle: item.snippet?.customUrl ?? "",
    thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? "",
    role,
  };
}

/**
 * List every channel this Google account can access. Manager-only channels
 * (Brand accounts you manage but don't own) are listed first, then owned
 * channels. Duplicates are merged with role "owner" when applicable.
 */
export async function listAccessibleChannels(
  token: string
): Promise<YouTubeChannelLink[]> {
  const [managed, owned] = await Promise.all([
    dataApi<ChannelListResponse>(token, "channels", {
      part: "snippet",
      managedByMe: "true",
      maxResults: "50",
    }).catch(() => ({ items: [] } as ChannelListResponse)),
    dataApi<ChannelListResponse>(token, "channels", {
      part: "snippet",
      mine: "true",
      maxResults: "50",
    }).catch(() => ({ items: [] } as ChannelListResponse)),
  ]);

  const ownedIds = new Set((owned.items ?? []).map((c) => c.id));
  const byId = new Map<string, YouTubeChannelLink>();

  // Managers first (excluding channels also owned — those are "owner").
  for (const item of managed.items ?? []) {
    if (ownedIds.has(item.id)) continue;
    byId.set(item.id, toLink(item, "manager"));
  }

  for (const item of owned.items ?? []) {
    byId.set(item.id, toLink(item, "owner"));
  }

  const managers = [...byId.values()].filter((c) => c.role === "manager");
  const owners = [...byId.values()].filter((c) => c.role === "owner");
  return [...managers, ...owners];
}

/** Prefer a managed channel; fall back to the first owned channel. */
export function pickDefaultChannel(
  channels: YouTubeChannelLink[]
): YouTubeChannelLink | null {
  if (!channels.length) return null;
  return channels.find((c) => c.role === "manager") ?? channels[0];
}

/** Analytics API `ids` parameter for a specific channel. */
export function analyticsIds(channelId: string): string {
  return `channel==${channelId}`;
}

/** Resolve the active channel id, throwing if none is selected. */
export function requireChannelId(account: {
  youtubeChannelId?: string | null;
  youtubeChannels?: YouTubeChannelLink[];
}): string {
  const id =
    account.youtubeChannelId ??
    pickDefaultChannel(account.youtubeChannels ?? [])?.id;
  if (!id) throw new Error("no YouTube channel selected");
  return id;
}

export function findChannelLink(
  channels: YouTubeChannelLink[],
  channelId: string
): YouTubeChannelLink | undefined {
  return channels.find((c) => c.id === channelId);
}
