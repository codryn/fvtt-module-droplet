import { describe, expect, it, vi } from "vitest";

import { CredentialStore } from "@/auth/CredentialStore";
import { DropboxOAuthService, type DropboxOAuthTransport } from "@/auth/DropboxOAuthService";
import { SETTINGS } from "@/constants";
import { FoundryV14Adapter } from "@/foundry/v14/FoundryV14Adapter";
import type { DropletConnectionState } from "@/types/settings";

function deferred<T>(): {
  readonly promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolveFn, rejectFn) => {
    resolve = resolveFn;
    reject = rejectFn;
  });

  return { promise, reject, resolve };
}

function createAdapter(connection: DropletConnectionState): FoundryV14Adapter {
  const state = new Map<string, unknown>([
    [SETTINGS.appKey, connection.appKey],
    [SETTINGS.accessMode, connection.accessMode],
    [SETTINGS.offlineAccess, true],
    [SETTINGS.connection, connection],
  ]);

  game.settings.get = vi.fn((_namespace: string, key: string) => state.get(key) ?? null);
  game.settings.set = vi.fn((_namespace: string, key: string, value: unknown) => {
    state.set(key, value);
    return Promise.resolve(value);
  });

  return new FoundryV14Adapter("14.365");
}

describe("DropboxOAuthService refresh serialization", () => {
  it("serializes concurrent refreshes behind one in-flight promise", async () => {
    const now = Date.now();
    const expiredConnection: DropletConnectionState = {
      accountId: "dbid:account1",
      accountLabel: "GM Example",
      accessMode: "appFolder",
      accessToken: "expired-token",
      appKey: "app-key",
      connectedAt: now - 120_000,
      expiresAt: now - 1,
      grantedScopes: ["account_info.read", "files.metadata.read", "files.content.read", "sharing.read", "sharing.write"],
      refreshToken: "refresh-token",
    };
    const adapter = createAdapter(expiredConnection);
    const refreshGate = deferred<{ accessToken: string; accountId: string; expiresIn: number; refreshToken: string | null; scope: string }>();
    const exchangeAuthorizationCode = vi.fn<DropboxOAuthTransport["exchangeAuthorizationCode"]>();
    const getCurrentAccount = vi.fn<DropboxOAuthTransport["getCurrentAccount"]>();
    const refreshAccessToken = vi.fn<DropboxOAuthTransport["refreshAccessToken"]>(() => refreshGate.promise);
    const revokeToken = vi.fn<DropboxOAuthTransport["revokeToken"]>(() => Promise.resolve());
    const transport: DropboxOAuthTransport = {
      exchangeAuthorizationCode,
      getCurrentAccount,
      refreshAccessToken,
      revokeToken,
    };
    const store = new CredentialStore(adapter, () => now - 120_000);
    const service = new DropboxOAuthService(adapter, transport, store, () => now);

    const first = service.getAccessToken();
    const second = service.getAccessToken();

    await Promise.resolve();

  expect(refreshAccessToken).toHaveBeenCalledTimes(1);

    refreshGate.resolve({
      accessToken: "fresh-token",
      accountId: expiredConnection.accountId,
      expiresIn: 14_400,
      refreshToken: null,
      scope: expiredConnection.grantedScopes.join(" "),
    });

    await expect(first).resolves.toBe("fresh-token");
    await expect(second).resolves.toBe("fresh-token");
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});