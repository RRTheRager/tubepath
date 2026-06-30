# TubePath Bug Audit (auto-generated)

> Generated at **2026-06-29T16:04:31.715Z** by `scripts/audit-repo.mjs`.
> Re-run locally: `node scripts/audit-repo.mjs`

## Summary

| Severity | Count |
| --- | ---: |
| Critical | 6 |
| High | 5 |
| Medium | 4 |
| Low | 0 |

## Critical

### SEC-001 — Checkout success can hijack another user's session

**Location:** `src/app/api/billing/checkout-success/route.ts:45`

A leaked Stripe session_id lets any browser bind the paying account to their cookie via setSessionId(accountId).

**Suggested fix:** Verify a signed checkout_state cookie from checkout start matches accountId before switching sessions.

### SEC-005 — Billing simulator only gated by Stripe config, not environment

**Location:** `src/app/api/billing/simulate/route.ts`

If Stripe env vars are missing in production, anyone can POST to grant themselves active status.

**Suggested fix:** Require NODE_ENV !== 'production' or explicit ENABLE_BILLING_SIMULATOR=true.

### SEC-006 — Free trial without payment when Stripe is not configured

**Location:** `src/app/api/billing/start-trial/route.ts:17`

Production without Stripe keys allows unlimited anonymous trials via cookie reset.

**Suggested fix:** Fail closed in production when Stripe is not configured.

### BILL-001 — reconcile() auto-promotes expired trials to active without Stripe

**Location:** `src/lib/store.ts:66`

On every getAccount() read, expired trialing accounts become active with a synthetic 30-day period.

**Suggested fix:** Skip auto-promotion when stripeSubscriptionId is set; only simulate locally in demo mode.

### DATA-001 — Supabase writes ignore errors

**Location:** `src/lib/storage/supabase.ts`

Failed upserts/deletes are silent; subscriptions and OAuth tokens may not persist.

**Suggested fix:** Check { error } on every Supabase call and throw or return failure to callers.

### DB-001 — Conflicting Supabase schemas (profiles vs accounts)

**Location:** `supabase/migrations/20250627000000_initial_schema.sql`

Initial migration defines auth.users/profiles/UUID google_accounts; schema.sql uses text-keyed accounts. App code expects schema.sql shape.

**Suggested fix:** Replace obsolete migration with one matching schema.sql, or document running schema.sql only.

## High

### SEC-002 — Session IDs use Math.random() instead of crypto

**Location:** `src/lib/session.ts:9`

Predictable session IDs combined with raw cookie-as-account-id enable account guessing.

**Suggested fix:** Use crypto.randomUUID() and sign cookies with SESSION_SECRET (HMAC).

### SEC-003 — SESSION_SECRET defined but never used for cookies

**Location:** `src/lib/env.ts`

Env exposes sessionSecret but session.ts stores raw account IDs without integrity checks.

**Suggested fix:** Wire HMAC-signed session tokens or remove the misleading env var from docs.

### SEC-004 — Public /api/ai/health exposes API key metadata

**Location:** `src/app/api/ai/health/route.ts`

Unauthenticated endpoint returns key prefix, last4, length, and format.

**Suggested fix:** Restrict to development or admin auth; return only { ok: boolean } in production.

### UI-001 — AnomalyList shows fake data when real anomalies are empty

**Location:** `src/components/dashboard/AnomalyList.tsx:16`

Fabricated spikes trigger AI explain calls and mislead users about channel performance.

**Suggested fix:** Show an empty state instead of PLACEHOLDERS when anomalies.length === 0.

### UI-002 — GoogleConnectGate bypassed when session fetch fails

**Location:** `src/components/youtube/GoogleConnectGate.tsx:25`

When data is null (failed /api/session), !data?.youtubeConfigured is true and gate passes.

**Suggested fix:** Treat !data as error state; only bypass when youtubeConfigured === false explicitly.

## Medium

### UI-003 — LockedGraphTeaser uses Math.random() during render (hydration mismatch)

**Location:** `packages/ui/src/components/LockedGraphTeaser.tsx`



**Suggested fix:** Use deterministic heights based on index, not Math.random().

### CFG-001 — Legacy monorepo (apps/, packages/) not wired into root workspaces

**Location:** `package.json`

README says apps/packages are not part of the build, but they remain in repo with broken workspace refs.

**Suggested fix:** Either remove legacy monorepo or add npm workspaces and separate CI jobs.

### CFG-002 — apps/web demo mode defaults ON unless explicitly disabled

**Location:** `apps/web/src/lib/env.ts`

Legacy web app serves demo data by default even in production.

**Suggested fix:** Default demo off in production; only enable with TUBEPATH_DEMO_MODE=true in dev.

### RES-001 — No Next.js error.tsx boundaries

A single render failure can crash the entire app shell.

**Suggested fix:** Add src/app/error.tsx and src/app/app/error.tsx with recovery UI.

---

See [BUG-AUDIT-REPORT.md](./BUG-AUDIT-REPORT.md) for the full manual audit with improvement roadmap.