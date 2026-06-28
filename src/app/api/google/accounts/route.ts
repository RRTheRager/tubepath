import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/session";
import {
  disconnectGoogleAccount,
  listGoogleAccountSummaries,
  switchGoogleAccount,
} from "@/lib/store";

export async function GET() {
  const account = await getCurrentAccount();
  const googleAccounts = await listGoogleAccountSummaries(account.id);
  return NextResponse.json({
    googleAccounts,
    activeGoogleAccountId: account.activeGoogleAccountId ?? null,
  });
}

export async function POST(req: Request) {
  const account = await getCurrentAccount();
  const body = (await req.json()) as { googleAccountId?: string; action?: string };

  if (body.action === "disconnect" && body.googleAccountId) {
    try {
      const updated = await disconnectGoogleAccount(
        account.id,
        body.googleAccountId
      );
      return NextResponse.json({ ok: true, account: updated });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Disconnect failed" },
        { status: 400 }
      );
    }
  }

  if (!body.googleAccountId) {
    return NextResponse.json({ error: "googleAccountId required" }, { status: 400 });
  }

  try {
    const updated = await switchGoogleAccount(account.id, body.googleAccountId);
    return NextResponse.json({ ok: true, account: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Switch failed" },
      { status: 400 }
    );
  }
}
