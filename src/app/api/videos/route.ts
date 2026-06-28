import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { getDataProvider } from "@/lib/data/provider";

export async function GET() {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  if (!caps.canEnterApp) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  const provider = await getDataProvider(account);
  const videos = await provider.getVideos();
  return NextResponse.json({ videos });
}
