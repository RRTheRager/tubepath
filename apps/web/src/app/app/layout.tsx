"use client";

import { AppShell } from "@/components/AppShell";
import { DesktopProGate } from "@/components/DesktopProGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DesktopProGate>
      <AppShell>{children}</AppShell>
    </DesktopProGate>
  );
}
