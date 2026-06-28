import Link from "next/link";
import { isDemoMode } from "@/lib/env";

export default function LoginPage() {
  const demo = isDemoMode();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/60 p-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold">Sign in to TubePath</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your Google account to access your YouTube channels.
        </p>

        {demo ? (
          <div className="mt-8 space-y-3">
            <Link
              href="/app/pulse"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
            >
              Continue with demo data
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Configure Supabase + Google OAuth in .env.local for real sign-in.
              See docs/api-setup.md
            </p>
          </div>
        ) : (
          <form action="/api/auth/google" method="GET" className="mt-8">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
            >
              Continue with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
