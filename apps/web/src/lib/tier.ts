import type { SubscriptionTier } from "@tubepath/core";
import { TIER_LIMITS } from "@tubepath/core";

export function getTierLimits(tier: SubscriptionTier) {
  return TIER_LIMITS[tier];
}

export function isPro(tier: SubscriptionTier): boolean {
  return tier === "pro";
}

export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_LIMITS.free
): boolean {
  const limits = TIER_LIMITS[tier];
  const freeLimits = TIER_LIMITS.free;
  const value = limits[feature];
  const freeValue = freeLimits[feature];

  if (typeof value === "boolean") return value;
  if (typeof value === "number" && typeof freeValue === "number") {
    return value > freeValue || value === Infinity;
  }
  if (Array.isArray(value)) {
    return value.length > (freeLimits[feature] as string[]).length;
  }
  return false;
}
