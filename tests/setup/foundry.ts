import { afterEach, vi } from "vitest";

type HookHandler = (...args: readonly unknown[]) => unknown;

const hookRegistry = new Map<string, Map<number, HookHandler>>();
let nextHookId = 1;

function getHookBucket(hookName: string): Map<number, HookHandler> {
  const existingBucket = hookRegistry.get(hookName);

  if (existingBucket) {
    return existingBucket;
  }

  const bucket = new Map<number, HookHandler>();
  hookRegistry.set(hookName, bucket);
  return bucket;
}

const notifications = {
  info: vi.fn<(message: string) => void>(),
  warn: vi.fn<(message: string) => void>(),
  error: vi.fn<(message: string) => void>(),
};

const foundryGlobals = globalThis as typeof globalThis & {
  Hooks?: {
    once: (hookName: string, handler: HookHandler) => number;
    on: (hookName: string, handler: HookHandler) => number;
    off: (hookName: string, id: number) => void;
    callAll: (hookName: string, payload?: unknown) => void;
  };
  ui?: {
    notifications: typeof notifications;
  };
  CONST?: {
    USER_ROLES: {
      GAMEMASTER: number;
    };
  };
  game?: {
    release: { generation: number };
    version: string;
    user: { id: string; role: number; isGM: boolean };
    i18n: {
      localize: (key: string) => string;
      format: (key: string, data: Record<string, string | number>) => string;
    };
    settings: {
      register: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
    modules: Map<string, { api?: unknown }>;
  };
};

foundryGlobals.Hooks = {
  once(hookName, handler) {
    const id = nextHookId++;
    const bucket = getHookBucket(hookName);
    bucket.set(id, (...args) => {
      bucket.delete(id);
      return handler(...args);
    });
    return id;
  },
  on(hookName, handler) {
    const id = nextHookId++;
    getHookBucket(hookName).set(id, handler);
    return id;
  },
  off(hookName, id) {
    getHookBucket(hookName).delete(id);
  },
  callAll(hookName, payload) {
    for (const handler of getHookBucket(hookName).values()) {
      handler(payload);
    }
  },
};

foundryGlobals.ui = { notifications };
foundryGlobals.CONST = { USER_ROLES: { GAMEMASTER: 4 } };
foundryGlobals.game = {
  release: { generation: 14 },
  version: "14.365",
  user: { id: "gm", role: 4, isGM: true },
  i18n: {
    localize: (key) => key,
    format: (key, data) => `${key}:${JSON.stringify(data)}`,
  },
  settings: {
    register: vi.fn<(namespace: string, key: string, definition: Record<string, unknown>) => void>(),
    get: vi.fn<(namespace: string, key: string) => unknown>(() => null),
    set: vi.fn<(namespace: string, key: string, value: unknown) => Promise<unknown>>((_namespace, _key, value) => Promise.resolve(value)),
  },
  modules: new Map(),
};

afterEach(() => {
  hookRegistry.clear();
  nextHookId = 1;
  vi.clearAllMocks();
});