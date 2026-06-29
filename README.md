# TubePath

YouTube analytics that feel premium — a polished dashboard, daily insights feed,
and an AI coach that doesn't just advise, it takes action.

![status](https://img.shields.io/badge/stack-Next.js%2015%20%C2%B7%20React%2019%20%C2%B7%20TypeScript-blue)

## Quick start

```bash
npm install
cp .env.example .env.local   # optional - the app runs fully without keys
npm run dev
```

Open http://localhost:3000. With **no environment variables set**, the app runs
entirely in demo mode:

- Rich, realistic **mock analytics** (views, engagement, watch time, CTR, spikes)
- **Simulated billing** - preview every access state from Settings
- **Canned AI** fallbacks for suggestions, insights, and the chatbot

Add keys progressively (see [Configuration](#configuration)) to switch on real
data, real AI, and real Stripe billing.

## Deploy to tubepath.org

See **[DEPLOY-TUBEPATH.md](DEPLOY-TUBEPATH.md)** — Vercel + Namecheap checklist with URLs pre-filled. Copy secrets from `.env.local` into Vercel using [`.env.production.example`](.env.production.example).

## The product model

There is **one plan: TubePath Premium**. There is no permanent free tier.

| State | Access | What you get |
| --- | --- | --- |
| `trialing` (days 0-3) | **Limited** | Core analytics, 30-day history, views chart, basic videos, streak/pulse feed with canned insights. No AI. |
| `active` (after day 3) | **Full** | Everything: AI coach + suggestions, all charts, anomaly detection, per-video deep dives, competitors, export. |
| none / `canceled` | **Paywall** | Prompted to start the 3-day trial. |

Signup starts a **3-day free trial that requires a card up front** and
**auto-converts** to paid unless canceled. The trial is intentionally the
limited experience - paying unlocks everything.

```
Sign up (card) -> Trial: LIMITED (3 days) --auto-charge--> Active: FULL
                                  \--cancel--> ends day 3, no charge -> Paywall
```

## Try the flows in demo mode

1. Land on `/`, click **Start 3-day free trial** -> you enter the app `trialing`
   (limited). Notice AI pages are gated and advanced charts are blurred.
2. Go to **Settings -> Billing simulator** and click **Premium (full)** (or
   **"Trial ends in 10s"** to watch the auto-convert), then revisit the feed,
   dashboard, AI Studio, and AI Coach - everything unlocks.
3. In **AI Coach**, try *"Rewrite the title of my latest video"* -> approve the
   proposed action -> the change is applied to the (mock) video.

## Configuration

All variables are optional. See [.env.example](.env.example).

| Area | Variables | Effect when set |
| --- | --- | --- |
| AI | `GEMINI_API_KEY` | Live Gemini generation for suggestions, insights, chat. |
| Real data | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | "Connect YouTube" OAuth; real data via the YouTube provider. |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Real Checkout (3-day trial), webhooks, Billing Portal. |
| Database | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persist accounts, subscriptions, and YouTube tokens (otherwise in-memory). |

When Stripe is configured, the dev billing simulator is automatically disabled.

### Database setup (Supabase)

Without these vars the app keeps accounts and YouTube tokens **in memory** (great
for demo; lost on restart). To persist:

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **SQL editor** and run [supabase/schema.sql](supabase/schema.sql) once
   (creates `accounts` + `youtube_credentials`, with RLS locked down).
3. From **Project Settings → API**, copy the project URL into `SUPABASE_URL` and
   the **service role** key into `SUPABASE_SERVICE_ROLE_KEY`.

The storage backend is selected automatically: Supabase when both vars are set,
otherwise in-memory ([src/lib/storage](src/lib/storage)).

### Connecting a real YouTube channel

With Google OAuth configured, **Settings → Connect YouTube** runs the consent
flow (`youtube.force-ssl` + `yt-analytics.readonly`). The callback stores the
refresh token and the dashboards/feed switch to live Data + Analytics API data.
If any API call fails, that request gracefully falls back to mock data so the UI
never breaks. The AI Coach's metadata edits (title/description/tags) call the
real `videos.update` endpoint when a channel is connected.

### Stripe setup notes

- Create a recurring **Price** and put its id in `STRIPE_PRICE_ID`.
- The 3-day, card-required trial is configured in code
  ([src/lib/billing.ts](src/lib/billing.ts)): `trial_period_days: 3`,
  `payment_method_collection: "always"`.
- Point a webhook at `/api/billing/webhook` for
  `checkout.session.completed` and `customer.subscription.*` events; the handler
  is the source of truth for subscription status.

## Architecture

```
src/
  app/
    page.tsx              Landing + pricing/paywall
    app/                  Authenticated app (gated by subscription status)
      feed/               Daily insights feed (home)
      dashboard/          Analytics: hero, stats, charts, anomalies
      videos/             Video list + per-video deep dive
      suggestions/        AI Studio (premium)
      chat/               AI Coach with tool-calling actions (premium)
      settings/           Account, billing, theme, dev simulator
    api/                  Route handlers (session, billing, data, ai, auth)
  components/
    macos/                Shell: vibrancy sidebar, traffic lights, Cmd+K palette
    feed/ charts/ ui/     Feed cards, charts, primitives
    access/               TrialBanner, UpgradeTeaser, PremiumGate
  lib/
    access.ts             Status -> capabilities (the single gating source)
    store.ts session.ts   Async account store + lightweight cookie session
    storage/              Persistence: interface + in-memory + Supabase backends
    billing.ts            Stripe (env-gated) + simulated billing
    data/                 DataProvider interface, MockProvider, YouTubeProvider
    ai/                   Gemini client, canned fallbacks, chatbot orchestration
    metrics.ts            Snapshots, z-score anomaly detection, daily pulse
```

Key ideas:

- **One gating source of truth**: [src/lib/access.ts](src/lib/access.ts) maps a
  subscription status to a `Capabilities` object the whole UI reads.
- **Provider abstraction**: the UI never knows if data is mock or real; see
  [src/lib/data/provider.ts](src/lib/data/provider.ts). Real YouTube calls fall
  back to mock per-request on failure.
- **Storage abstraction**: accounts and OAuth tokens go through one interface
  with in-memory and Supabase backends; tokens are stored separately from the
  account and never sent to the client.
- **AI degrades gracefully**: every AI call falls back to high-quality canned
  content when no key is present, so the premium experience is always demoable.

## Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # run the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Notes

- This is a self-contained app at the repo root. The previous monorepo
  (`apps/`, `packages/`) is not part of the build.
- Storage is now pluggable: set the Supabase vars for durable accounts +
  subscriptions + YouTube tokens, or leave them unset for the in-memory demo
  store. The Stripe webhook handler writes through the same `updateAccount` API.
