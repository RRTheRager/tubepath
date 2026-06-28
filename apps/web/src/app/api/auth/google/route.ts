import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { isDemoMode } from "@/lib/env";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.redirect(new URL("/app/pulse", getAppUrl()));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${getAppUrl()}/api/auth/callback/google`;
  const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
  ].join(" ");

  if (!clientId) {
    return NextResponse.redirect(new URL("/login", getAppUrl()));
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
