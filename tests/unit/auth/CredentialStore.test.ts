import { describe, expect, it, vi } from "vitest";

import { CredentialStore } from "@/auth/CredentialStore";
import { SETTINGS } from "@/constants";
import { FoundryV14Adapter } from "@/foundry/v14/FoundryV14Adapter";
import { getSettingDefinition } from "@/settings/registerSettings";
import type { DropletConnectionState } from "@/types/settings";

function createAdapter(initialConnection: DropletConnectionState | null = null): FoundryV14Adapter {
  const state = new Map<string, unknown>([
    [SETTINGS.connection, initialConnection],
  ]);

  game.settings.get = vi.fn((_namespace: string, key: string) => state.get(key) ?? null);
  game.settings.set = vi.fn((_namespace: string, key: string, value: unknown) => {
    state.set(key, value);
    return Promise.resolve(value);
  });

  return new FoundryV14Adapter("14.365");
}

describe("CredentialStore", () => {
  it("keeps authentication state in a client-scoped setting", () => {
    expect(getSettingDefinition(SETTINGS.connection).scope).toBe("client");
  });

  it("reads, writes, and clears connection state with expiry handling", async () => {
    const now = Date.now();
    const adapter = createAdapter();
    const store = new CredentialStore(adapter, () => now);
    const connection: DropletConnectionState = {
      accountId: "dbid:account1",
      accountLabel: "GM Example",
      accessMode: "appFolder",
      accessToken: "access-token",
      appKey: "app-key",
      connectedAt: now,
      expiresAt: now + 60_000,
      grantedScopes: ["account_info.read", "files.metadata.read", "files.content.read", "sharing.read", "sharing.write"],
      refreshToken: "refresh-token",
    };

    await store.write(connection);
    await expect(store.read()).resolves.toEqual(connection);

    const expiredStore = new CredentialStore(createAdapter({ ...connection, expiresAt: now - 1 }), () => now);
    await expect(expiredStore.read()).resolves.toBeNull();

    await store.clear();
    await expect(store.read()).resolves.toBeNull();
  });
});