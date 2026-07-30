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

  public registerSetting<K extends SettingKey>(_key: K, _definition: SettingDefinition<K>): void {
    return undefined;
  }

  public getSetting<K extends SettingKey>(_key: K): SettingValue<K> {
    throw new Error(`${MODULE_ID} settings are unavailable on unsupported Foundry versions.`);
  }

  public async setSetting<K extends SettingKey>(_key: K, _value: SettingValue<K>): Promise<void> {
    return undefined;
  }

  public onReady(_handler: () => void): void {
    return undefined;
  }

  public onRender(_hookName: string, _handler: (root: HTMLElement, context: unknown) => void): HookId {
    return 0;
  }

  public off(_hookName: string, _id: HookId): void {
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
