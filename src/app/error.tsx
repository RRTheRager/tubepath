"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. You can try again or return home.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Home
        </Button>
      </div>
    </div>
  );
}
