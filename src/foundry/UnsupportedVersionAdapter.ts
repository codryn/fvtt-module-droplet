import { MODULE_ID } from "@/constants";
import type {
  FoundryAdapter,
  HookId,
  NotificationLevel,
} from "@/foundry/FoundryAdapter";
import type {
  SettingDefinition,
  SettingKey,
  SettingValue,
} from "@/types/settings";

export class UnsupportedVersionAdapter implements FoundryAdapter {
  public readonly supported = false;

  public constructor(
    public readonly generation: 13 | 14,
    public readonly version: string,
  ) {}

  public currentUserId(): string {
    return game.user?.id ?? "";
  }

  public currentUserRole(): number {
    return game.user?.role ?? 0;
  }

  public isGamemaster(): boolean {
    return game.user?.isGM ?? false;
  }

  public registerSetting<K extends SettingKey>(key: K, definition: SettingDefinition<K>): void {
    void key;
    void definition;
    return undefined;
  }

  public getSetting<K extends SettingKey>(key: K): SettingValue<K> {
    void key;
    throw new Error(`${MODULE_ID} settings are unavailable on unsupported Foundry versions.`);
  }

  public setSetting<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<void> {
    void key;
    void value;
    return Promise.resolve();
  }

  public onReady(handler: () => void): void {
    void handler;
    return undefined;
  }

  public onRender(hookName: string, handler: (root: HTMLElement, context: unknown) => void): HookId {
    void hookName;
    void handler;
    return 0;
  }

  public off(hookName: string, id: HookId): void {
    void hookName;
    void id;
    return undefined;
  }

  public notify(level: NotificationLevel, message: string): void {
    const notifications = ui.notifications;

    if (!notifications) {
      return;
    }

    notifications[level](message);
  }

  public localize(key: string, data?: Record<string, string | number>): string {
    if (!game.i18n) {
      return key;
    }

    return data ? game.i18n.format(key, data) : game.i18n.localize(key);
  }
}
