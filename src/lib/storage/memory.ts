import type { Account, GoogleAccount, GoogleCredentials } from "@/lib/types";
import type { Storage } from "./types";

interface Shape {
  accounts: Map<string, Account>;
  googleAccounts: Map<string, GoogleAccount>;
  /** @deprecated legacy single credential per tubepath account */
  legacyCredentials: Map<string, GoogleCredentials & { accountId?: string }>;
}

const g = globalThis as unknown as { __tubepathMem?: Shape };
const mem: Shape =
  g.__tubepathMem ??
  (g.__tubepathMem = {
    accounts: new Map(),
    googleAccounts: new Map(),
    legacyCredentials: new Map(),
  });

export class MemoryStorage implements Storage {
  async getAccount(id: string): Promise<Account | null> {
    return mem.accounts.get(id) ?? null;
  }

  async saveAccount(account: Account): Promise<void> {
    mem.accounts.set(account.id, account);
  }

  async listGoogleAccounts(tubepathAccountId: string): Promise<GoogleAccount[]> {
    return [...mem.googleAccounts.values()].filter(
      (g) => g.tubepathAccountId === tubepathAccountId
    );
  }

  async getGoogleAccount(id: string): Promise<GoogleAccount | null> {
    return mem.googleAccounts.get(id) ?? null;
  }

  async getGoogleAccountBySub(
    tubepathAccountId: string,
    googleSub: string
  ): Promise<GoogleAccount | null> {
    return (
      [...mem.googleAccounts.values()].find(
        (g) =>
          g.tubepathAccountId === tubepathAccountId && g.googleSub === googleSub
      ) ?? null
    );
  }

  async saveGoogleAccount(account: GoogleAccount): Promise<void> {
    mem.googleAccounts.set(account.id, account);
  }

  async deleteGoogleAccount(id: string): Promise<void> {
    mem.googleAccounts.delete(id);
  }

  async getLegacyCredentials(
    tubepathAccountId: string
  ): Promise<GoogleCredentials | null> {
    const legacy = mem.legacyCredentials.get(tubepathAccountId);
    if (!legacy) return null;
    return {
      googleAccountId: legacy.googleAccountId ?? tubepathAccountId,
      tubepathAccountId,
      refreshToken: legacy.refreshToken,
      accessToken: legacy.accessToken,
      accessTokenExpiry: legacy.accessTokenExpiry,
    };
  }

  async deleteLegacyCredentials(tubepathAccountId: string): Promise<void> {
    mem.legacyCredentials.delete(tubepathAccountId);
  }

  /** @deprecated used when migrating old in-memory creds */
  async saveCredentials(creds: GoogleCredentials & { accountId?: string }) {
    const id = creds.tubepathAccountId ?? creds.accountId;
    if (id) mem.legacyCredentials.set(id, creds);
  }
}
