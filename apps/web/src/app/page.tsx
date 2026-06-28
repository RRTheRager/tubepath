import Link from "next/link";
import { Activity, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TubePath</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/app/pulse"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
            YouTube command center
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Know your channel in 10 seconds.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Big numbers. One hero graph. AI tips that actually help. Trace your creative
            inspiration from competitor to upload.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/app/pulse"
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              <Sparkles className="h-5 w-5" />
              Try demo — no signup needed
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-6 py-3 font-semibold text-foreground"
            >
              Connect YouTube
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Pulse dashboard",
              desc: "Engagement hero stat, views graph, daily change cards, and AI insight feed.",
            },
            {
              title: "Pro analytics",
              desc: "All 5 metrics graphed, spike detection, competitor tracking, and previews.",
            },
            {
              title: "Inspiration pipeline",
              desc: "Trace your creative lineage from competitor videos to your uploads.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border/50 bg-card/40 p-6 backdrop-blur-md"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
