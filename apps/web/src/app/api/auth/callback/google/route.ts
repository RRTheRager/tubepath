import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { discoverChannels } from "@/lib/sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", getAppUrl()));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${getAppUrl()}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login", getAppUrl()));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/login?error=token", getAppUrl()));
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser = await userRes.json();

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  if (supabase) {
    const channels = await discoverChannels(tokens.access_token);

    const { data: existingAccount } = await supabase
      .from("google_accounts")
      .select("id, user_id")
      .eq("google_id", googleUser.id)
      .single();

    let userId = existingAccount?.user_id;

    if (!userId) {
      const { data: authUser, error } = await supabase.auth.admin.createUser({
        email: googleUser.email,
        email_confirm: true,
        user_metadata: { full_name: googleUser.name },
      });
      if (error && !authUser) {
        return NextResponse.redirect(new URL("/login?error=user", getAppUrl()));
      }
      userId = authUser?.user?.id;
    }

    if (userId) {
      const { data: account } = await supabase
        .from("google_accounts")
        .upsert({
          user_id: userId,
          google_id: googleUser.id,
          email: googleUser.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(
            Date.now() + (tokens.expires_in ?? 3600) * 1000
          ).toISOString(),
        })
        .select()
        .single();

      for (const ch of channels) {
        await supabase.from("channel_connections").upsert(
          {
            user_id: userId,
            google_account_id: account?.id,
            youtube_channel_id: ch.youtubeChannelId,
            title: ch.title,
            thumbnail_url: ch.thumbnailUrl,
            role: ch.role,
            subscriber_count: ch.subscriberCount,
          },
          { onConflict: "user_id,youtube_channel_id" }
        );
      }
    }
  }

  return NextResponse.redirect(new URL("/app/pulse", getAppUrl()));
}
