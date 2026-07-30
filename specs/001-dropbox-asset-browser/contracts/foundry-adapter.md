# Contract: Foundry surface

**Feature**: 001-dropbox-asset-browser | **Plan**: [../plan.md](../plan.md)

`FoundryAdapter` is the only place in the codebase permitted to touch `game`, `ui`, `Hooks`,
`CONFIG`, or any other Foundry global. Services depend on the interface, never on an
implementation, and never on a version branch.

```ts
interface FoundryAdapter {
  readonly generation: 13 | 14;

  // Identity and permissions
  currentUserId(): string;
  currentUserRole(): number;
  isGamemaster(): boolean;

  // Settings
  registerSetting<K extends SettingKey>(key: K, definition: SettingDefinition<K>): void;
  getSetting<K extends SettingKey>(key: K): SettingValue<K>;
  setSetting<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<void>;

  // Hooks
  onReady(handler: () => void): void;
  onRender(hookName: string, handler: (root: HTMLElement, context: unknown) => void): HookId;
  off(hookName: string, id: HookId): void;

  // Notifications
  notify(level: "info" | "warn" | "error", message: string): void;

  // Localization
  localize(key: string, data?: Record<string, string | number>): string;
}
```

**Rules**

1. No method accepts or returns a Foundry class instance. Where a sheet's root element is needed,
   it is passed as a plain `HTMLElement`.
2. `generation` exists for diagnostics and for the compatibility gate only. Services must not
   branch on it; behavioural differences belong inside the adapter implementations.
3. `registerSetting` is called during `init` only. No Dropbox request is made during `init` or
   `ready`.
4. If the running Foundry version falls outside the compatibility matrix, adapter selection fails
   with `UnsupportedFoundryVersion` and the module registers nothing beyond a single notification.

## Scene asset field integration

`SceneAssetFieldIntegration` is the only consumer of `onRender`. It is driven by descriptors
rather than by hard-coded field knowledge:

```ts
interface AssetFieldDescriptor {
  hookName: string;      // e.g. "renderSceneConfig"
  fieldName: string;     // e.g. "background.src"
  assetType: AssetCategory;
  labelKey: string;
}

interface SceneAssetFieldIntegration {
  install(descriptors: readonly AssetFieldDescriptor[]): void;
  uninstall(): void;
}
```

**Behavioural contract**

| Guarantee | Detail |
|---|---|
| Additive | The native file-picker control is never altered, hidden, removed, or re-bound |
| Located by name | The target input is found by its Foundry field `name`, never by CSS class or DOM shape |
| One control | Exactly one `<button type="button" class="droplet-browse">` is inserted per descriptor per render |
| No saving | On selection the integration sets `input.value` and dispatches bubbling `input` then `change`; it never saves the document |
| Silent degradation | If the field cannot be located, the handler returns after recording a diagnostic entry, with no user-visible error |
| Reversible | `uninstall()` removes every registered hook and every inserted control |

Release 1 registers exactly one descriptor: the `SceneConfig` background image. Adding surfaces
later means adding descriptors, not code paths.

## Undocumented API usage

None in release 1. Every hook and class relied upon appears in the public Foundry v14 API
documentation. Any future dependency on a non-public surface must live under
`src/foundry/unstable/` with a header comment naming the API, the verified version range, the
failure mode when it disappears, and the test that covers it.
