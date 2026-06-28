// Centralized, typed access to environment configuration.
// Every integration is optional; helpers report whether it is configured.

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

const defaultAppUrl =
  process.env.NODE_ENV === "production"
    ? "https://tubepath.org"
    : "http://localhost:3000";

const appUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl
);

export const env = {
  appUrl,
  sessionSecret: process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me",

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    fallbackModel:
      process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    // Auto-derived from appUrl — set GOOGLE_REDIRECT_URI only to override.
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      `${appUrl}/api/auth/callback/google`,
  },  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    priceId: process.env.STRIPE_PRICE_ID ?? "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
};

export const isAiConfigured = () => env.gemini.apiKey.length > 0;
export const isYouTubeConfigured = () =>
  env.google.clientId.length > 0 && env.google.clientSecret.length > 0;
export const isStripeConfigured = () =>
  env.stripe.secretKey.length > 0 && env.stripe.priceId.length > 0;
export const isDbConfigured = () =>
  env.supabase.url.length > 0 && env.supabase.serviceRoleKey.length > 0;

/** Trial length in days, per product spec. */
export const TRIAL_DAYS = 3;
/** Grace period (days) after a failed payment before access is revoked. */
export const GRACE_DAYS = 7;
/** Premium price shown in the UI. */
export const PREMIUM_PRICE_LABEL = "$12/mo";
