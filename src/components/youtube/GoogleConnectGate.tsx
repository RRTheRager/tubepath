"use client";

import { Youtube, BarChart3, Sparkles, Shield } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";

/**
 * Full-screen first-run prompt: after subscribing, connect Google before using the app.
 */
export function GoogleConnectGate({ children }: { children: React.ReactNode }) {
  const { data, loading } = useSession();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loading label="Loading TubePath" />
      </div>
    );
  }

  const hasGoogle =
    (data?.googleAccounts?.length ?? 0) > 0 || data?.account.youtubeConnected;

  if (!data?.youtubeConfigured || hasGoogle) {
    return children;
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto px-6 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[10%] h-72 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <div className="app-card w-full max-w-lg text-center shadow-app-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF0000]/15 text-[#FF0000]">
          <Youtube className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Connect YouTube to get started
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          TubePath pulls your channel analytics after you sign in with Google.
          We don&apos;t show demo numbers — your dashboard stays empty until you
          connect.
        </p>

        <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left text-sm">
          {[
            { icon: BarChart3, text: "Real views, engagement, and growth metrics" },
            { icon: Sparkles, text: "AI insights trained on your channel data" },
            { icon: Shield, text: "Read-only access — we never post for you" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <Button
          className="mt-8 w-full"
          size="lg"
          onClick={() => {
            window.location.href = "/api/auth/google";
          }}
        >
          <Youtube className="h-4 w-4" /> Sign in with Google
        </Button>
      </div>
    </div>
  );
}
