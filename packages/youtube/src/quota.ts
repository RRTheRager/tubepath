export interface QuotaTracker {
  used: number;
  limit: number;
  record(units: number): void;
  canAfford(units: number): boolean;
}

export function createQuotaTracker(limit = 10000): QuotaTracker {
  let used = 0;
  return {
    get used() {
      return used;
    },
    get limit() {
      return limit;
    },
    record(units: number) {
      used += units;
    },
    canAfford(units: number) {
      return used + units <= limit;
    },
  };
}

export const QUOTA_COSTS = {
  channelsList: 1,
  videosList: 1,
  searchList: 100,
  analyticsQuery: 1,
  videosUpdate: 50,
} as const;
