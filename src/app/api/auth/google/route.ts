import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env, isYouTubeConfigured } from "@/lib/env";
import { getSessionId } from "@/lib/session";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export async function GET(req: Request) {
  if (!isYouTubeConfigured()) {
    return NextResponse.redirect(
      `${env.appUrl}/app/settings?error=youtube_not_configured`
    );
  }

  const url = new URL(req.url);
  const addAccount = url.searchParams.get("add") === "1";
  const sessionId = await getSessionId();

  const jar = await cookies();
  jar.set(
    "google_oauth_ctx",
    JSON.stringify({ sessionId, add: addAccount }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    }
  );

  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: addAccount ? "select_account consent" : "consent",
    scope: SCOPES.join(" "),
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
