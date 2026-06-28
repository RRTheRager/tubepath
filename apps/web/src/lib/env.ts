export function isDemoMode(): boolean {
  return process.env.TUBEPATH_DEMO_MODE !== "false";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
