import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/env";
import { updateVideoMetadata } from "@tubepath/youtube";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.tier !== "pro") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const body = await request.json();

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const { data: googleAccount } = await supabase
    ?.from("google_accounts")
    .select("access_token")
    .eq("user_id", session.userId)
    .single() ?? { data: null };

  if (!googleAccount?.access_token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  await updateVideoMetadata({
    accessToken: googleAccount.access_token,
    videoId: body.videoId,
    title: body.title,
    description: body.description,
    tags: body.tags,
  });

  return NextResponse.json({ ok: true });
}
