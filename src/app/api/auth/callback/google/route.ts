import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env, isYouTubeConfigured } from "@/lib/env";
import { getCurrentAccount } from "@/lib/session";
import { connectGoogleAccount } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!isYouTubeConfigured() || !code) {
    return NextResponse.redirect(
      `${env.appUrl}/app/settings?error=youtube_auth_failed`
    );
  }

  const jar = await cookies();
  const ctxRaw = jar.get("google_oauth_ctx")?.value;
  jar.delete("google_oauth_ctx");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.google.clientId,
        client_secret: env.google.clientSecret,
        redirect_uri: env.google.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const account = await getCurrentAccount();
    if (ctxRaw) {
      const ctx = JSON.parse(ctxRaw) as { sessionId?: string };
      if (ctx.sessionId && ctx.sessionId !== account.id) {
        throw new Error("session mismatch");
      }
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!profileRes.ok) throw new Error("userinfo failed");
    const profile = (await profileRes.json()) as {
      id: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    await connectGoogleAccount(
      account.id,
      {
        sub: profile.id,
        email: profile.email ?? "",
        name: profile.name ?? profile.email ?? "Google account",
        picture: profile.picture ?? "",
      },
      tokens
    );

    return NextResponse.redirect(`${env.appUrl}/app/feed?connected=1`);
  } catch {
    return NextResponse.redirect(
      `${env.appUrl}/app/settings?error=youtube_auth_failed`
    );
  }
}
