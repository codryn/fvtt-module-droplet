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

export class FoundryV14Adapter implements FoundryAdapter {
  public readonly generation = 14;
  public readonly supported = true;

  public constructor(public readonly version: string) {}

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
    game.settings.register(MODULE_ID, key, { ...definition });
  }

  public getSetting<K extends SettingKey>(key: K): SettingValue<K> {
    return game.settings.get(MODULE_ID, key) as SettingValue<K>;
  }

  public async setSetting<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<void> {
    await game.settings.set(MODULE_ID, key, value);
  }

  public onReady(handler: () => void): void {
    Hooks.once("ready", handler);
  }

  public onRender(hookName: string, handler: (root: HTMLElement, context: unknown) => void): HookId {
    return Hooks.on(hookName, (...args: unknown[]) => {
      const root = args[1];
      const context = args[2];

      if (root instanceof HTMLElement) {
        handler(root, context);
      }
    });
  }

  public off(hookName: string, id: HookId): void {
    Hooks.off(hookName, id);
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
