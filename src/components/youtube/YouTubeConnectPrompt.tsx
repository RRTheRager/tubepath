"use client";

import Link from "next/link";
import { Settings, Youtube } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function YouTubeConnectPrompt({
  variant = "sign-in",
}: {
  /** sign-in: no Google account yet; select-channel: linked but no channel picked */
  variant?: "sign-in" | "select-channel";
}) {
  const isSignIn = variant === "sign-in";

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="mac-card max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF0000]/15 text-[#FF0000]">
          <Youtube className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold">
          {isSignIn ? "Connect your YouTube channel" : "Choose a channel"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignIn
            ? "Sign in with Google to load your real views, videos, and analytics. TubePath does not show placeholder stats."
            : "Your Google account is linked. Pick which YouTube channel to track in Settings."}
        </p>
        {isSignIn ? (
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => {
              window.location.href = "/api/auth/google";
            }}
          >
            <Youtube className="h-4 w-4" /> Sign in with Google
          </Button>
        ) : (
          <Link href="/app/settings" className="mt-6 block">
            <Button className="w-full" variant="secondary" size="lg">
              <Settings className="h-4 w-4" /> Open Settings
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
