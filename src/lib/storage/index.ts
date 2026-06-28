import { isDbConfigured } from "@/lib/env";
import type { Storage } from "./types";
import { MemoryStorage } from "./memory";
import { SupabaseStorage } from "./supabase";

export type { Storage } from "./types";

let instance: Storage | null = null;

/** Returns Supabase storage when configured, otherwise in-memory. */
export function getStorage(): Storage {
  if (!instance) {
    instance = isDbConfigured() ? new SupabaseStorage() : new MemoryStorage();
  }
  return instance;
}
