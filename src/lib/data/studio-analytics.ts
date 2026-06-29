import type { Account, StudioAnalytics, StudioBreakdownRow, StudioRevenue } from "@/lib/types";
import { getAccessToken, analyticsReport, isoDaysAgo, isoToday } from "./youtube-client";
import { analyticsIds, requireChannelId } from "@/lib/youtube/channels";
import { getCredentials } from "@/lib/store";

function colIndex(headers: { name: string }[], name: string): number {
  return headers.findIndex((c) => c.name === name);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function friendlyTraffic(raw: string): string {
  const map: Record<string, string> = {
    RELATED_VIDEO: "Suggested videos",
    YT_SEARCH: "YouTube search",
    SUBSCRIBER: "Browse features",
    YT_CHANNEL: "Your channel",
    EXT_URL: "External",
    END_SCREEN: "End screens",
    NOTIFICATION: "Notifications",
    PLAYLIST: "Playlists",
    SHORTS: "Shorts feed",
    ADVERTISING: "YouTube ads",
    NO_LINK_OTHER: "Direct / unknown",
  };
  return map[raw] ?? raw.replace(/_/g, " ").toLowerCase();
}

function friendlyDevice(raw: string): string {
  const map: Record<string, string> = {
    MOBILE: "Mobile",
    DESKTOP: "Computer",
    TV: "TV",
    TABLET: "Tablet",
    GAME_CONSOLE: "Game console",
    UNKNOWN_PLATFORM: "Other",
  };
  return map[raw] ?? raw.replace(/_/g, " ").toLowerCase();
}

async function totalsReport(
  token: string,
  ids: string,
  startDate: string,
  endDate: string
) {
  return analyticsReport(token, {
    ids,
    startDate,
    endDate,
    metrics:
      "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares,impressions,impressionsClickThroughRate",
  });
}

async function revenueReport(
  token: string,
  ids: string,
  startDate: string,
  endDate: string
) {
  return analyticsReport(token, {
    ids,
    startDate,
    endDate,
    metrics: "estimatedRevenue,estimatedAdRevenue,playbackBasedCpm",
  });
}

function breakdownFromReport(
  report: Awaited<ReturnType<typeof analyticsReport>>,
  dimName: string,
  labelFn: (raw: string) => string
): StudioBreakdownRow[] {
  const di = colIndex(report.columnHeaders, dimName);
  const vi = colIndex(report.columnHeaders, "views");
  const rows = report.rows ?? [];
  const total = rows.reduce((a, r) => a + num(r[vi]), 0) || 1;
  return rows.slice(0, 8).map((r) => {
    const views = num(r[vi]);
    return {
      label: labelFn(String(r[di])),
      views,
      pct: Math.round((views / total) * 100),
    };
  });
}

export async function fetchStudioAnalytics(
  account: Account,
  periodDays = 28
): Promise<StudioAnalytics> {
  const creds = await getCredentials(account.id);
  if (!creds?.refreshToken) throw new Error("Not connected");

  const token = await getAccessToken(creds);
  const channelId = requireChannelId(account);
  const ids = analyticsIds(channelId);
  const days = Math.min(Math.max(periodDays, 7), 90);
  const startDate = isoDaysAgo(days);
  const endDate = isoToday();

  const totals = await totalsReport(token, ids, startDate, endDate);
  const row = totals.rows?.[0] ?? [];

  const vi = colIndex(totals.columnHeaders, "views");
  const wi = colIndex(totals.columnHeaders, "estimatedMinutesWatched");
  const avd = colIndex(totals.columnHeaders, "averageViewDuration");
  const avp = colIndex(totals.columnHeaders, "averageViewPercentage");
  const sgi = colIndex(totals.columnHeaders, "subscribersGained");
  const sli = colIndex(totals.columnHeaders, "subscribersLost");
  const li = colIndex(totals.columnHeaders, "likes");
  const ci = colIndex(totals.columnHeaders, "comments");
  const shi = colIndex(totals.columnHeaders, "shares");
  const ii = colIndex(totals.columnHeaders, "impressions");
  const cti = colIndex(totals.columnHeaders, "impressionsClickThroughRate");

  let revenue: StudioRevenue | null = null;
  let monetized = false;
  try {
    const rev = await revenueReport(token, ids, startDate, endDate);
    const rrow = rev.rows?.[0] ?? [];
    const eri = colIndex(rev.columnHeaders, "estimatedRevenue");
    const eari = colIndex(rev.columnHeaders, "estimatedAdRevenue");
    const cpmi = colIndex(rev.columnHeaders, "playbackBasedCpm");
    const estRev = num(rrow[eri]);
    const adRev = num(rrow[eari]);
    const cpm = num(rrow[cpmi]);
    if (estRev > 0 || adRev > 0 || cpm > 0) {
      monetized = true;
      const views = num(row[vi]);
      revenue = {
        estimatedRevenue: estRev,
        estimatedAdRevenue: adRev,
        playbackCpm: cpm,
        rpm: views > 0 ? (estRev / views) * 1000 : 0,
      };
    }
  } catch {
    /* not monetized or revenue unavailable */
  }

  let trafficSources: StudioBreakdownRow[] = [];
  let devices: StudioBreakdownRow[] = [];
  let countries: StudioBreakdownRow[] = [];

  try {
    const traffic = await analyticsReport(token, {
      ids,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
      maxResults: "10",
    });
    trafficSources = breakdownFromReport(
      traffic,
      "insightTrafficSourceType",
      friendlyTraffic
    );
  } catch {
    /* optional */
  }

  try {
    const device = await analyticsReport(token, {
      ids,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "deviceType",
      sort: "-views",
      maxResults: "8",
    });
    devices = breakdownFromReport(device, "deviceType", friendlyDevice);
  } catch {
    /* optional */
  }

  try {
    const country = await analyticsReport(token, {
      ids,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "country",
      sort: "-views",
      maxResults: "10",
    });
    countries = breakdownFromReport(country, "country", (c) => c);
  } catch {
    /* optional */
  }

  return {
    periodDays: days,
    monetized,
    totals: {
      views: num(row[vi]),
      impressions: num(row[ii]),
      ctr: Number(num(row[cti]).toFixed(2)),
      watchTimeHours: Math.round(num(row[wi]) / 60),
      avgViewDurationSeconds: Math.round(num(row[avd])),
      avgViewPercentage: Number(num(row[avp]).toFixed(1)),
      subscribersGained: num(row[sgi]),
      subscribersLost: num(row[sli]),
      likes: num(row[li]),
      comments: num(row[ci]),
      shares: num(row[shi]),
    },
    revenue,
    trafficSources,
    devices,
    countries,
  };
}
