import { env } from "@/lib/env";
import type { GoogleCredentials } from "@/lib/types";
import { saveGoogleAccountTokens } from "@/lib/store";

const DATA_API = "https://www.googleapis.com/youtube/v3";
const ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";

/**
 * Returns a valid access token, refreshing via the stored refresh token when
 * expired and persisting the new token. Throws if refresh fails.
 */
export async function getAccessToken(creds: GoogleCredentials): Promise<string> {
  const stillValid =
    creds.accessToken &&
    creds.accessTokenExpiry &&
    creds.accessTokenExpiry - Date.now() > 60_000;
  if (stillValid && creds.accessToken) return creds.accessToken;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const updated: GoogleCredentials = {
    ...creds,
    accessToken: data.access_token,
    accessTokenExpiry: Date.now() + data.expires_in * 1000,
  };
  await saveGoogleAccountTokens(updated);
  return data.access_token;
}

export async function dataApi<T>(
  token: string,
  path: string,
  params: Record<string, string>
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${DATA_API}/${path}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`YouTube Data API ${path} ${res.status}`);
  return (await res.json()) as T;
}

export async function dataApiPut<T>(
  token: string,
  path: string,
  params: Record<string, string>,
  body: unknown
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${DATA_API}/${path}?${qs}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`YouTube Data API PUT ${path} ${res.status}`);
  return (await res.json()) as T;
}

export interface AnalyticsReport {
  columnHeaders: { name: string }[];
  rows?: (string | number)[][];
}

export async function analyticsReport(
  token: string,
  params: Record<string, string>
): Promise<AnalyticsReport> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ANALYTICS_API}/reports?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`YouTube Analytics ${res.status}`);
  return (await res.json()) as AnalyticsReport;
}

export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
