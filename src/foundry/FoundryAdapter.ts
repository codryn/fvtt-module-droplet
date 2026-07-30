import type {
  SettingDefinition,
  SettingKey,
  SettingValue,
} from "@/types/settings";

export type HookId = number;
export type NotificationLevel = "info" | "warn" | "error";

export interface FoundryAdapter {
  readonly generation: 13 | 14;
  readonly supported: boolean;
  readonly version: string;

  currentUserId(): string;
  currentUserRole(): number;
  isGamemaster(): boolean;

  registerSetting<K extends SettingKey>(key: K, definition: SettingDefinition<K>): void;
  getSetting<K extends SettingKey>(key: K): SettingValue<K>;
  setSetting<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<void>;

  onReady(handler: () => void): void;
  onRender(hookName: string, handler: (root: HTMLElement, context: unknown) => void): HookId;
  off(hookName: string, id: HookId): void;

  notify(level: NotificationLevel, message: string): void;
  localize(key: string, data?: Record<string, string | number>): string;
}
