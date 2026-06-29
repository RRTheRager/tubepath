"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg font-semibold">This page hit a snag</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        TubePath ran into a problem loading this view. Your account and data are
        safe — try refreshing.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/app/feed")}>
          Back to feed
        </Button>
      </div>
    </div>
  );
}
