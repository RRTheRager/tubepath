#!/usr/bin/env node
/**
 * TubePath static audit — scans the repo for known bug patterns and security
 * footguns. Run on every push via GitHub Actions; also usable locally:
 *
 *   node scripts/audit-repo.mjs
 *   node scripts/audit-repo.mjs --json
 *   node scripts/audit-repo.mjs --write-report docs/BUG-AUDIT-LATEST.md
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const jsonOut = args.has("--json");
const writeReport = args.has("--write-report");
const reportPath = writeReport
  ? process.argv[process.argv.indexOf("--write-report") + 1]
  : null;

/** @typedef {{ id: string, severity: "critical"|"high"|"medium"|"low", category: string, title: string, file?: string, line?: number, detail: string, fix: string }} Finding */

/** @type {Finding[]} */
const findings = [];

function add(finding) {
  findings.push(finding);
}

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

function grep(pattern, rel, opts = {}) {
  const content = read(rel);
  if (!content) return [];
  const re = new RegExp(pattern, opts.flags ?? "m");
  const lines = content.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      hits.push({ line: i + 1, text: lines[i].trim() });
      re.lastIndex = 0;
    }
  }
  return hits;
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ---------------------------------------------------------------------------
// Security checks
// ---------------------------------------------------------------------------

if (grep("setSessionId\\(accountId\\)", "src/app/api/billing/checkout-success/route.ts").length) {
  add({
    id: "SEC-001",
    severity: "critical",
    category: "security",
    title: "Checkout success can hijack another user's session",
    file: "src/app/api/billing/checkout-success/route.ts",
    line: 45,
    detail:
      "A leaked Stripe session_id lets any browser bind the paying account to their cookie via setSessionId(accountId).",
    fix: "Verify a signed checkout_state cookie from checkout start matches accountId before switching sessions.",
  });
}

if (grep("Math\\.random\\(\\)", "src/lib/session.ts").length) {
  add({
    id: "SEC-002",
    severity: "high",
    category: "security",
    title: "Session IDs use Math.random() instead of crypto",
    file: "src/lib/session.ts",
    line: 9,
    detail: "Predictable session IDs combined with raw cookie-as-account-id enable account guessing.",
    fix: "Use crypto.randomUUID() and sign cookies with SESSION_SECRET (HMAC).",
  });
}

const envContent = read("src/lib/env.ts") ?? "";
if (envContent.includes("SESSION_SECRET") && !grep("sessionSecret", "src/lib/session.ts").length) {
  add({
    id: "SEC-003",
    severity: "high",
    category: "security",
    title: "SESSION_SECRET defined but never used for cookies",
    file: "src/lib/env.ts",
    detail: "Env exposes sessionSecret but session.ts stores raw account IDs without integrity checks.",
    fix: "Wire HMAC-signed session tokens or remove the misleading env var from docs.",
  });
}

if (fileExists("src/app/api/ai/health/route.ts")) {
  const health = read("src/app/api/ai/health/route.ts");
  if (health?.includes("last4") || health?.includes("prefix")) {
    add({
      id: "SEC-004",
      severity: "high",
      category: "security",
      title: "Public /api/ai/health exposes API key metadata",
      file: "src/app/api/ai/health/route.ts",
      detail: "Unauthenticated endpoint returns key prefix, last4, length, and format.",
      fix: "Restrict to development or admin auth; return only { ok: boolean } in production.",
    });
  }
}

const simulate = read("src/app/api/billing/simulate/route.ts");
if (simulate && !simulate.includes("NODE_ENV") && simulate.includes("isStripeConfigured()")) {
  add({
    id: "SEC-005",
    severity: "critical",
    category: "security",
    title: "Billing simulator only gated by Stripe config, not environment",
    file: "src/app/api/billing/simulate/route.ts",
    detail:
      "If Stripe env vars are missing in production, anyone can POST to grant themselves active status.",
    fix: "Require NODE_ENV !== 'production' or explicit ENABLE_BILLING_SIMULATOR=true.",
  });
}

const startTrial = read("src/app/api/billing/start-trial/route.ts");
if (startTrial?.includes("startTrial") && startTrial.includes("simulated")) {
  add({
    id: "SEC-006",
    severity: "critical",
    category: "security",
    title: "Free trial without payment when Stripe is not configured",
    file: "src/app/api/billing/start-trial/route.ts",
    line: 17,
    detail: "Production without Stripe keys allows unlimited anonymous trials via cookie reset.",
    fix: "Fail closed in production when Stripe is not configured.",
  });
}

// ---------------------------------------------------------------------------
// Billing / data integrity
// ---------------------------------------------------------------------------

const store = read("src/lib/store.ts") ?? "";
if (/status = "active"/.test(store) && store.includes("trialing")) {
  add({
    id: "BILL-001",
    severity: "critical",
    category: "billing",
    title: "reconcile() auto-promotes expired trials to active without Stripe",
    file: "src/lib/store.ts",
    line: 66,
    detail:
      "On every getAccount() read, expired trialing accounts become active with a synthetic 30-day period.",
    fix: "Skip auto-promotion when stripeSubscriptionId is set; only simulate locally in demo mode.",
  });
}

const cancel = read("src/app/api/billing/cancel/route.ts") ?? "";
const resume = read("src/app/api/billing/resume/route.ts") ?? "";
if (cancel.includes("getStripe()") && !cancel.includes("cancelSubscription")) {
  add({
    id: "BILL-002",
    severity: "high",
    category: "billing",
    title: "Stripe cancel route does not update local account state",
    file: "src/app/api/billing/cancel/route.ts",
    detail: "UI stays stale until webhook arrives; cancelAtPeriodEnd may be wrong for minutes or forever.",
    fix: "Call cancelSubscription() or applyStripeSubscription() immediately after Stripe API success.",
  });
}
if (resume.includes("getStripe()") && !resume.includes("resumeSubscription")) {
  add({
    id: "BILL-003",
    severity: "high",
    category: "billing",
    title: "Stripe resume route does not update local account state",
    file: "src/app/api/billing/resume/route.ts",
    fix: "Sync local DB immediately after Stripe resume succeeds.",
  });
}

const supabase = read("src/lib/storage/supabase.ts") ?? "";
if (supabase.includes(".upsert(") && !supabase.includes("if (error)")) {
  add({
    id: "DATA-001",
    severity: "critical",
    category: "data",
    title: "Supabase writes ignore errors",
    file: "src/lib/storage/supabase.ts",
    detail: "Failed upserts/deletes are silent; subscriptions and OAuth tokens may not persist.",
    fix: "Check { error } on every Supabase call and throw or return failure to callers.",
  });
}

// ---------------------------------------------------------------------------
// Schema / migrations
// ---------------------------------------------------------------------------

const initialMigration = read("supabase/migrations/20250627000000_initial_schema.sql");
const schema = read("supabase/schema.sql");
if (initialMigration && schema) {
  const migrationUsesProfiles = initialMigration.includes("profiles");
  const schemaUsesAccounts = schema.includes("public.accounts");
  if (migrationUsesProfiles && schemaUsesAccounts) {
    add({
      id: "DB-001",
      severity: "critical",
      category: "database",
      title: "Conflicting Supabase schemas (profiles vs accounts)",
      file: "supabase/migrations/20250627000000_initial_schema.sql",
      detail:
        "Initial migration defines auth.users/profiles/UUID google_accounts; schema.sql uses text-keyed accounts. App code expects schema.sql shape.",
      fix: "Replace obsolete migration with one matching schema.sql, or document running schema.sql only.",
    });
  }
}

// ---------------------------------------------------------------------------
// UI / UX correctness
// ---------------------------------------------------------------------------

const anomaly = read("src/components/dashboard/AnomalyList.tsx") ?? "";
if (anomaly.includes("PLACEHOLDERS") && anomaly.includes("anomalies.length ? anomalies : PLACEHOLDERS")) {
  add({
    id: "UI-001",
    severity: "high",
    category: "ui",
    title: "AnomalyList shows fake data when real anomalies are empty",
    file: "src/components/dashboard/AnomalyList.tsx",
    line: 16,
    detail: "Fabricated spikes trigger AI explain calls and mislead users about channel performance.",
    fix: "Show an empty state instead of PLACEHOLDERS when anomalies.length === 0.",
  });
}

const gate = read("src/components/youtube/GoogleConnectGate.tsx") ?? "";
if (gate.includes("!data?.youtubeConfigured || hasGoogle")) {
  add({
    id: "UI-002",
    severity: "high",
    category: "ui",
    title: "GoogleConnectGate bypassed when session fetch fails",
    file: "src/components/youtube/GoogleConnectGate.tsx",
    line: 25,
    detail: "When data is null (failed /api/session), !data?.youtubeConfigured is true and gate passes.",
    fix: "Treat !data as error state; only bypass when youtubeConfigured === false explicitly.",
  });
}

const lockedTeaser = read("packages/ui/src/components/LockedGraphTeaser.tsx");
if (lockedTeaser?.includes("Math.random()")) {
  add({
    id: "UI-003",
    severity: "medium",
    category: "ui",
    title: "LockedGraphTeaser uses Math.random() during render (hydration mismatch)",
    file: "packages/ui/src/components/LockedGraphTeaser.tsx",
    fix: "Use deterministic heights based on index, not Math.random().",
  });
}

// ---------------------------------------------------------------------------
// Monorepo / deploy drift (legacy apps/ + packages/)
// ---------------------------------------------------------------------------

const rootPkg = JSON.parse(read("package.json") ?? "{}");
if (fileExists("apps/web/package.json") && !rootPkg.workspaces) {
  add({
    id: "CFG-001",
    severity: "medium",
    category: "config",
    title: "Legacy monorepo (apps/, packages/) not wired into root workspaces",
    file: "package.json",
    detail:
      "README says apps/packages are not part of the build, but they remain in repo with broken workspace refs.",
    fix: "Either remove legacy monorepo or add npm workspaces and separate CI jobs.",
  });
}

if (fileExists("apps/web/src/lib/env.ts")) {
  const webEnv = read("apps/web/src/lib/env.ts") ?? "";
  if (webEnv.includes('TUBEPATH_DEMO_MODE !== "false"')) {
    add({
      id: "CFG-002",
      severity: "medium",
      category: "config",
      title: "apps/web demo mode defaults ON unless explicitly disabled",
      file: "apps/web/src/lib/env.ts",
      detail: "Legacy web app serves demo data by default even in production.",
      fix: "Default demo off in production; only enable with TUBEPATH_DEMO_MODE=true in dev.",
    });
  }
}

// ---------------------------------------------------------------------------
// Missing resilience patterns
// ---------------------------------------------------------------------------

if (!fileExists("src/app/app/error.tsx") && !fileExists("src/app/error.tsx")) {
  add({
    id: "RES-001",
    severity: "medium",
    category: "resilience",
    title: "No Next.js error.tsx boundaries",
    detail: "A single render failure can crash the entire app shell.",
    fix: "Add src/app/error.tsx and src/app/app/error.tsx with recovery UI.",
  });
}

// ---------------------------------------------------------------------------
// npm audit (dependency vulnerabilities)
// ---------------------------------------------------------------------------

/** @type {{ moderate?: number, high?: number, critical?: number }} */
let npmAudit = {};
try {
  const raw = execSync("npm audit --json", { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  const parsed = JSON.parse(raw);
  npmAudit = parsed.metadata?.vulnerabilities ?? {};
  const total = (npmAudit.critical ?? 0) + (npmAudit.high ?? 0) + (npmAudit.moderate ?? 0);
  if (total > 0) {
    add({
      id: "DEP-001",
      severity: npmAudit.high || npmAudit.critical ? "high" : "medium",
      category: "dependencies",
      title: `npm audit: ${total} vulnerability/vulnerabilities`,
      detail: `critical=${npmAudit.critical ?? 0}, high=${npmAudit.high ?? 0}, moderate=${npmAudit.moderate ?? 0}`,
      fix: "Run npm audit and upgrade affected packages (postcss via next).",
    });
  }
} catch (e) {
  if (e.stdout) {
    try {
      const parsed = JSON.parse(e.stdout);
      npmAudit = parsed.metadata?.vulnerabilities ?? {};
    } catch {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
for (const f of findings) bySeverity[f.severity]++;

const summary = {
  scannedAt: new Date().toISOString(),
  total: findings.length,
  bySeverity,
  npmAudit,
  findings,
};

if (jsonOut) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`\nTubePath repo audit — ${findings.length} finding(s)\n`);
  console.log(
    `  critical: ${bySeverity.critical}  high: ${bySeverity.high}  medium: ${bySeverity.medium}  low: ${bySeverity.low}\n`
  );
  for (const sev of ["critical", "high", "medium", "low"]) {
    const group = findings.filter((f) => f.severity === sev);
    if (!group.length) continue;
    console.log(`── ${sev.toUpperCase()} ──`);
    for (const f of group) {
      const loc = f.file ? `${f.file}${f.line ? `:${f.line}` : ""}` : "(repo-wide)";
      console.log(`  [${f.id}] ${f.title}`);
      console.log(`      ${loc}`);
      console.log(`      ${f.detail}`);
      console.log(`      Fix: ${f.fix}\n`);
    }
  }
}

if (writeReport && reportPath) {
  const md = renderMarkdown(summary);
  fs.mkdirSync(path.dirname(path.join(ROOT, reportPath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, reportPath), md);
  if (!jsonOut) console.log(`Report written to ${reportPath}`);
}

// Exit non-zero if any critical/high findings (for CI)
const fail = bySeverity.critical + bySeverity.high;
process.exit(fail > 0 ? 1 : 0);

function renderMarkdown(summary) {
  const lines = [
    "# TubePath Bug Audit (auto-generated)",
    "",
    `> Generated at **${summary.scannedAt}** by \`scripts/audit-repo.mjs\`.`,
    "> Re-run locally: `node scripts/audit-repo.mjs`",
    "",
    "## Summary",
    "",
    "| Severity | Count |",
    "| --- | ---: |",
    `| Critical | ${summary.bySeverity.critical} |`,
    `| High | ${summary.bySeverity.high} |`,
    `| Medium | ${summary.bySeverity.medium} |`,
    `| Low | ${summary.bySeverity.low} |`,
    "",
  ];

  for (const sev of ["critical", "high", "medium", "low"]) {
    const group = summary.findings.filter((f) => f.severity === sev);
    if (!group.length) continue;
    lines.push(`## ${sev.charAt(0).toUpperCase() + sev.slice(1)}`, "");
    for (const f of group) {
      lines.push(`### ${f.id} — ${f.title}`, "");
      if (f.file) lines.push(`**Location:** \`${f.file}${f.line ? `:${f.line}` : ""}\``, "");
      lines.push(f.detail, "", `**Suggested fix:** ${f.fix}`, "");
    }
  }

  lines.push(
    "---",
    "",
    "See [BUG-AUDIT-REPORT.md](./BUG-AUDIT-REPORT.md) for the full manual audit with improvement roadmap."
  );
  return lines.join("\n");
}
