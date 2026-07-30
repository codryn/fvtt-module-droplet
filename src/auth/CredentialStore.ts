import { SETTINGS } from "@/constants";
import type { FoundryAdapter } from "@/foundry/FoundryAdapter";
import { validateSettingValue } from "@/settings/validators";
import type { DropletConnectionState } from "@/types/settings";

export class CredentialStore {
  public constructor(
    private readonly adapter: FoundryAdapter,
    private readonly now: () => number = () => Date.now(),
  ) {}

  public async read(): Promise<DropletConnectionState | null> {
    const state = validateSettingValue(SETTINGS.connection, this.adapter.getSetting(SETTINGS.connection));

    if (!state) {
      return null;
    }

    if (state.expiresAt <= this.now()) {
      await this.clear();
      return null;
    }

    return state;
  }

  public async write(state: DropletConnectionState): Promise<DropletConnectionState> {
    const sanitizedState = validateSettingValue(SETTINGS.connection, state);

    if (!sanitizedState) {
      throw new Error("CredentialStore refused to persist an empty connection state.");
    }

    if (sanitizedState.expiresAt <= this.now()) {
      throw new Error("CredentialStore refused to persist an already-expired connection state.");
    }

    await this.adapter.setSetting(SETTINGS.connection, sanitizedState);
    return sanitizedState;
  }

  public async clear(): Promise<void> {
    await this.adapter.setSetting(SETTINGS.connection, null);
  }
}