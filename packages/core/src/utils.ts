import { createHash } from "crypto";

export function hashContext(input: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex")
    .slice(0, 32);
}

export function isCacheValid(createdAt: Date, ttlHours = 24): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs < ttlHours * 60 * 60 * 1000;
}

export function getStreakDays(checkInDates: string[]): number {
  if (checkInDates.length === 0) return 0;

  const sorted = [...new Set(checkInDates)].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
