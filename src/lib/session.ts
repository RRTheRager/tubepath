import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAccount } from "./store";
import type { Account } from "./types";
import { env } from "./env";

const SESSION_COOKIE = "tubepath_sid";
const CHECKOUT_COOKIE = "tubepath_checkout";

function signValue(value: string): string {
  const sig = createHmac("sha256", env.sessionSecret)
    .update(value)
    .digest("base64url");
  return `${value}.${sig}`;
}

function verifySignedValue(raw: string): string | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = createHmac("sha256", env.sessionSecret)
    .update(value)
    .digest("base64url");
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return value;
}

function sessionCookieOptions(maxAge = 60 * 60 * 24 * 365) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

/** Persist the session cookie (route handlers only). */
export async function setSessionId(sid: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signValue(sid), sessionCookieOptions());
}

/** Mark which account initiated Stripe Checkout (route handlers only). */
export async function setCheckoutIntent(accountId: string): Promise<void> {
  const jar = await cookies();
  jar.set(
    CHECKOUT_COOKIE,
    signValue(accountId),
    sessionCookieOptions(60 * 60)
  );
}

/** Read the account id that started Checkout, if the cookie is valid. */
export async function getCheckoutIntent(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(CHECKOUT_COOKIE)?.value;
  if (!raw) return null;
  return verifySignedValue(raw);
}

export async function clearCheckoutIntent(): Promise<void> {
  const jar = await cookies();
  jar.delete(CHECKOUT_COOKIE);
}

/**
 * Resolve the current session id from the cookie, creating one if needed.
 * Safe to call from Server Components and Route Handlers.
 */
export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) {
    const verified = verifySignedValue(existing);
    if (verified) return verified;
  }

  const sid = randomUUID();
  try {
    jar.set(SESSION_COOKIE, signValue(sid), sessionCookieOptions());
  } catch {
    // Server Components cannot always set cookies; the value still works
    // for the duration of this request and is persisted on the next mutation.
  }
  return sid;
}

export async function getCurrentAccount(): Promise<Account> {
  const sid = await getSessionId();
  return getAccount(sid);
}
