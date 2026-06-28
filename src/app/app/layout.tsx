import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { AppShell } from "@/components/macos/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);

  // No active subscription -> send to the paywall / landing page.
  if (!caps.canEnterApp) redirect("/");

  return <AppShell>{children}</AppShell>;
}
