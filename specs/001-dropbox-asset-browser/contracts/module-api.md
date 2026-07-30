# Contract: Public module API, manifest, settings, localization

**Feature**: 001-dropbox-asset-browser | **Plan**: [../plan.md](../plan.md)

These are the surfaces other modules, macros, and the Foundry package system depend on. Removing
or renaming anything here is a breaking change requiring a major version bump and a release note.

## Manifest (`static/module.json`)

| Field | Value |
|---|---|
| `id` | `droplet` |
| `type` | `module` |
| `esmodules` | `["module.js"]` |
| `styles` | `["styles/droplet.css"]` |
| `languages` | `en` at minimum, with `lang/en.json` |
| `compatibility` | `minimum` and `verified` per the compatibility matrix in the plan |
| `socket` | `false` — Droplet sends nothing over the socket |
| `relationships` | empty; no module dependencies |

The manifest declares no external script sources. All code ships in the package.

## Public JavaScript API

Exposed once, on `ready`, as `game.modules.get("droplet").api`:

```ts
interface DropletApi {
  readonly version: string;

  /** Connection status; never exposes a token. */
  status(): { connected: boolean; accountLabel: string | null; accessMode: AccessMode };

  /**
   * Opens the browser in select mode and resolves with a stable https URL,
   * or null if the user cancels.
   */
  pickAsset(options?: {
    type?: AssetCategory;
    startPath?: string;
    signal?: AbortSignal;
  }): Promise<string | null>;

  /** Resolves a Dropbox path already inside the authorized root to a stable URL. */
  resolveUrl(path: string, signal?: AbortSignal): Promise<string>;

  /** Clears folder, thumbnail, and shared-link caches. Documents are untouched. */
  clearCaches(): Promise<void>;
}
```

**Guarantees**

1. No API method returns, logs, or otherwise exposes an access token, refresh token,
   authorization code, or PKCE verifier.
2. `pickAsset` and `resolveUrl` reject with a `DropletError`, never a raw error.
3. `resolveUrl` enforces the root policy; a path outside the authorized root rejects with
   `RootPolicyViolation` rather than being silently clamped.
4. Returned URLs are always canonical `https://www.dropbox.com/...?raw=1` form with `rlkey`
   preserved and no `dl` parameter. A temporary link is never returned — see
   [dropbox-client.md](dropbox-client.md) and RE-013.
5. Calling any method before `ready` throws synchronously.

## Emitted hooks

| Hook | Payload | When |
|---|---|---|
| `droplet.ready` | `{ api }` | Once, after the module finishes `ready` setup |
| `droplet.connectionChanged` | `{ connected, accountLabel }` | After connect, disconnect, or a failed refresh |
| `droplet.assetSelected` | `{ url, path, category }` | After a selection resolves, before the field is written |

Hooks are notifications. Droplet does not read return values from hook listeners, so a listener
cannot veto a selection.

## Settings keys

Registered under the `droplet` namespace. World scope unless marked client.

| Key | Type | Default | Scope |
|---|---|---|---|
| `appKey` | string | `""` | world |
| `accessMode` | `"appFolder" \| "fullDropbox"` | `appFolder` | world |
| `rootPath` | string | `""` | world |
| `allowSvg` | boolean | `false` | world |
| `offlineAccess` | boolean | `false` | world |
| `browsePermissionRole` | number | GM | world |
| `folderCacheTtlSeconds` | number | `300` | world |
| `pageSize` | number | `200` | world |
| `thumbnailBatchSize` | number | `25` | world |
| `thumbnailBatchesInFlight` | number | `2` | world |
| `showSharedLinkWarning` | boolean | `true` | world |
| `connection` | connection state or `null` | `null` | **client** |
| `lastBrowsedPath` | string | `""` | **client** |
| `displayMode` | `"list" \| "grid"` | `list` | **client** |

**Invariant, covered by a test**: no world-scoped setting ever holds authentication state. A test
asserts that the serialized world settings for the module contain no token-shaped value.

## Localization

Every user-visible string comes from `lang/en.json` through `localization/t.ts`. No fallback
English literal appears in source. Key namespaces:

| Namespace | Covers |
|---|---|
| `DROPLET.settings.*` | Setting names and hints |
| `DROPLET.browser.*` | Browser chrome, empty states, filters |
| `DROPLET.auth.*` | Connect, disconnect, code entry, warnings |
| `DROPLET.errors.<Code>.message` | One per `DropletErrorCode` |
| `DROPLET.errors.<Code>.recovery` | Recovery text for the same code |
| `DROPLET.warnings.*` | Shared-link, Full Dropbox, SVG, and offline-access warnings |

A test asserts that every `DropletErrorCode` has both a `message` and a `recovery` key, and that
`en.json` contains no unused keys.
