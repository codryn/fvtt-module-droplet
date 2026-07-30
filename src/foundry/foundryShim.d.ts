declare const Hooks: {
  once(hookName: string, handler: (...args: unknown[]) => unknown): number;
  on(hookName: string, handler: (...args: unknown[]) => unknown): number;
  off(hookName: string, id: number): void;
  callAll(hookName: string, payload?: unknown): void;
};

declare const ui: {
  notifications?: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
};

declare const CONST: {
  USER_ROLES?: {
    GAMEMASTER?: number;
  };
};

declare const game: {
  release?: {
    generation?: number;
  };
  version?: string;
  user?: {
    id?: string;
    role?: number;
    isGM?: boolean;
  };
  i18n?: {
    localize(key: string): string;
    format(key: string, data: Record<string, string | number>): string;
  };
  settings: {
    register(namespace: string, key: string, definition: Record<string, unknown>): void;
    get(namespace: string, key: string): unknown;
    set(namespace: string, key: string, value: unknown): Promise<unknown>;
  };
  modules?: Map<string, { api?: unknown }>;
};
