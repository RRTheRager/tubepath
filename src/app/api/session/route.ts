import { NextResponse } from "next/server";
import { getCurrentAccount, getSessionId } from "@/lib/session";
import { capabilitiesFor, trialDaysRemaining } from "@/lib/access";
import {
  isAiConfigured,
  isStripeConfigured,
  isYouTubeConfigured,
} from "@/lib/env";
import {
  listGoogleAccountSummaries,
  listGoogleAccounts,
  syncYouTubeChannels,
} from "@/lib/store";

export async function GET() {
  await getSessionId();
  let account = await getCurrentAccount();

  const googleAccounts = await listGoogleAccountSummaries(account.id);

  // Backfill channels for connected Google accounts missing channel data.
  if (
    googleAccounts.length > 0 &&
    (!account.youtubeChannels?.length || !account.youtubeChannelId)
  ) {
    try {
      const synced = await syncYouTubeChannels(account.id);
      account = synced.account;
    } catch {
      /* keep existing */
    }
  } else if (account.youtubeConnected && googleAccounts.length === 0) {
    /* legacy flag without google_accounts rows — sync will migrate */
    try {
      const synced = await syncYouTubeChannels(account.id);
      account = synced.account;
    } catch {
      /* ignore */
    }
  }

  // Ensure youtubeConnected reflects linked Google logins.
  const linked = await listGoogleAccounts(account.id);
  if (linked.length > 0 && !account.youtubeConnected) {
    account = { ...account, youtubeConnected: true };
  }

  return NextResponse.json({
    account,
    googleAccounts: googleAccounts.length
      ? googleAccounts
      : await listGoogleAccountSummaries(account.id),
    activeGoogleAccountId: account.activeGoogleAccountId ?? null,
    capabilities: capabilitiesFor(account.status),
    trialDaysLeft: trialDaysRemaining(account.trialEnd),
    graceDaysLeft: trialDaysRemaining(account.graceEndsAt ?? null),
    stripeConfigured: isStripeConfigured(),
    aiConfigured: isAiConfigured(),
    youtubeConfigured: isYouTubeConfigured(),
  });
}
