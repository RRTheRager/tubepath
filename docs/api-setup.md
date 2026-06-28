# TubePath API Setup Guide

Follow these steps to connect TubePath to Google, Supabase, Gemini, and Stripe.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named `tubepath`
3. Enable APIs:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
4. Configure **OAuth consent screen**:
   - User type: External
   - Scopes: `openid`, `email`, `profile`, `youtube.readonly`, `yt-analytics.readonly`, `youtube.force-ssl` (Pro edit)
   - Add test users while in development
5. Create **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.com/api/auth/callback/google`

Copy **Client ID** and **Client Secret**.

## 2. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Authentication > Providers > Google** and enable with your OAuth credentials
3. Run migrations:
   ```bash
   npx supabase db push
   ```
   Or paste `supabase/migrations/20250627000000_initial_schema.sql` in the SQL editor.
4. Copy **Project URL** and **anon key** (and **service role key** for server-side sync)

## 3. Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Set `GEMINI_API_KEY` in your environment

## 4. Stripe (optional for billing)

1. Create account at [stripe.com](https://stripe.com)
2. Create a Product: **TubePath Pro** with monthly price
3. Copy **Publishable key**, **Secret key**, and **Price ID**
4. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## 5. Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth (also configure in Supabase)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini
GEMINI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=

# Demo mode (uses mock data when APIs not configured)
TUBEPATH_DEMO_MODE=true
```

Set `TUBEPATH_DEMO_MODE=false` once all credentials are configured.

## 6. YouTube Quota

Default quota is 10,000 units/day. TubePath caches aggressively:
- Free tier: 1 sync/day per channel
- Pro tier: 1 sync/hour per channel

Monitor usage in Google Cloud Console > APIs & Services > Dashboard.

## 7. Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)
