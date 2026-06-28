import { cookies } from "next/headers";
import { getAccount } from "./store";
import type { Account } from "./types";

const SESSION_COOKIE = "tubepath_sid";

function randomId(): string {
  return (
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  ).slice(0, 24);
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  };
}

/** Persist the session cookie (route handlers only). */
export async function setSessionId(sid: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sid, sessionCookieOptions());
}

/**
 * Resolve the current session id from the cookie, creating one if needed.
 * Safe to call from Server Components and Route Handlers.
 */
export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sid = randomId();
  // In a Server Component this set is best-effort; route handlers persist it.
  try {
    jar.set(SESSION_COOKIE, sid, sessionCookieOptions());
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
