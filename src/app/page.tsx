import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getCurrentAccount } from "@/lib/session";
import { capabilitiesFor } from "@/lib/access";
import { PREMIUM_PRICE_LABEL } from "@/lib/env";
import { StartTrialButton } from "@/components/marketing/StartTrialButton";
import { Logo } from "@/components/brand/Logo";
import { TrafficLights } from "@/components/macos/TrafficLights";

export default async function LandingPage() {
  const account = await getCurrentAccount();
  const caps = capabilitiesFor(account.status);
  const hasAccess = caps.canEnterApp;

  return (
    <div className="grain relative min-h-screen overflow-hidden">
      {/* ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo variant="full" href="/" priority className="h-10 w-auto" />
        {hasAccess ? (
          <Link
            href="/app"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Open app <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="pt-12 text-center md:pt-20">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI analytics for serious creators
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Your YouTube analytics,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              finally premium.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Track views, engagement, and growth in a clean dashboard, a daily
            insights feed, and an AI coach that doesn&apos;t just advise &mdash;
            it takes action.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            {hasAccess ? (
              <Link
                href="/app"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground"
              >
                Open TubePath <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <StartTrialButton />
            )}
            <p className="text-xs text-muted-foreground">
              Card required &middot; No charge for 3 days &middot; Cancel anytime
            </p>
          </div>

          {/* App window mock */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="mac-card overflow-hidden p-0 shadow-mac-lg">
              <div className="flex h-10 items-center gap-3 border-b border-border bg-card/80 px-4">
                <TrafficLights />
                <Logo variant="icon" className="h-5 w-5" />
                <span className="text-xs text-muted-foreground">Insights</span>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {[
                  { k: "Views (28d)", v: "1.84M", d: "+12.4%" },
                  { k: "Engagement", v: "6.7%", d: "+0.9%" },
                  { k: "Subscribers", v: "+4,210", d: "+18%" },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg border border-border p-4 text-left">
                    <p className="text-xs text-muted-foreground">{s.k}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{s.v}</p>
                    <p className="text-xs font-semibold text-success">{s.d}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-left md:col-span-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <Sparkles className="h-4 w-4" /> AI insight
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    🔥 Your weekend uploads outperform weekdays by 18%. Schedule
                    your next high-effort video for Saturday morning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-5 py-24 md:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: "Analytics that read themselves",
              body: "Engagement, views, watch time, CTR, and spike detection - explained in plain language, not just charts.",
            },
            {
              icon: Sparkles,
              title: "Daily insights feed",
              body: "Bite-sized wins, streaks, and daily pulses so you always know what changed and what to do next.",
            },
            {
              icon: Bot,
              title: "An AI coach that acts",
              body: "Ask why views dropped, then let the chatbot rewrite your title, draft a description, or generate tags - with one tap to apply.",
            },
          ].map((f) => (
            <div key={f.title} className="mac-card">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <section id="pricing" className="pb-28">
          <div className="mx-auto max-w-md">
            <div className="mac-card relative overflow-hidden shadow-mac-lg">
              <div className="absolute right-4 top-4">
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                  3-day free trial
                </span>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                TubePath Premium
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{PREMIUM_PRICE_LABEL}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything, unlocked. Starts free for 3 days, then auto-renews
                unless you cancel.
              </p>

              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "Full analytics history + all charts",
                  "Spike & anomaly detection",
                  "Per-video deep dives",
                  "AI suggestions: titles, descriptions, tags, hooks",
                  "AI coach with one-tap actions",
                  "Competitor benchmarking & export",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {hasAccess ? (
                  <Link
                    href="/app"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-medium text-primary-foreground"
                  >
                    Open TubePath <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <StartTrialButton className="w-full" />
                )}
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Wand2 className="h-3.5 w-3.5" />
                Trial shows a limited preview &middot; paying unlocks everything
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
