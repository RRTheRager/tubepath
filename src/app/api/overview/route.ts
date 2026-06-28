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
  const overview = await provider.getOverview({
    historyDays: caps.historyDays || 30,
  });

  // Strip anomalies during the trial (anomaly detection is premium).
  if (!caps.anomalyDetection) overview.anomalies = [];

  return NextResponse.json({ overview, capabilities: caps });
}
