# Contract: Typed errors

**Feature**: 001-dropbox-asset-browser | **Plan**: [../plan.md](../plan.md)

Every failure that crosses a service boundary is a `DropletError`. No layer above the transport
ever inspects an HTTP status code or a Dropbox error tag.

```ts
abstract class DropletError extends Error {
  readonly code: DropletErrorCode;
  readonly i18nKey: string;
  readonly recovery: RecoveryAction;
  readonly technicalDetail: string; // already passed through Redactor
  readonly cause?: unknown;
}

type RecoveryAction =
  | { kind: "none" }
  | { kind: "reconnect" }
  | { kind: "retry"; afterMs?: number }
  | { kind: "openSettings"; section?: string }
  | { kind: "chooseAnotherFile" }
  | { kind: "documentation"; anchor: string };
```

**Invariants**

1. `technicalDetail` is produced by `Redactor` and is safe to render verbatim. It never contains
   an access token, a refresh token, an authorization code, a PKCE verifier, or a full shared-link
   URL.
2. Rejecting with a raw `Error`, a string, or a Dropbox payload is a contract violation, enforced
   by a lint rule at the service boundary.
3. No `catch` block may discard an error without classifying it and either reporting it to the
   user or recording it in diagnostics.
4. `Cancelled` is never shown to the user.

## Codes

| Code | Raised when | Recovery |
|---|---|---|
| `NotConnected` | An operation needs Dropbox and no connection exists | `reconnect` |
| `AuthorizationDenied` | The user declined at Dropbox, or a 403 `AccessError` | `reconnect` |
| `OAuthStateMismatch` | Redirect-mode `state` mismatch, wrong `event.origin`, no pending verifier, or an expired session | `reconnect` |
| `AuthorizationExpired` | 401 `expired_access_token` and refresh is unavailable | `reconnect` |
| `TokenRefreshFailure` | The refresh grant failed, or 401 `invalid_access_token` / `user_suspended` / `route_access_denied` | `reconnect` |
| `InsufficientScopes` | A 403 indicates a scope the app was not granted | `openSettings` |
| `InvalidAppKey` | The configured app key is malformed or rejected at authorize time | `openSettings` |
| `RootFolderMissing` | The configured root does not resolve to a folder | `openSettings` |
| `RootPolicyViolation` | A candidate path resolved outside the authorized root | `none` |
| `FileDeleted` | `get_metadata` reports the file is gone | `chooseAnotherFile` |
| `FolderDeleted` | The current folder no longer exists | `none` |
| `UnsupportedMediaType` | The extension is not a supported asset type, or SVG while `allowSvg` is off | `chooseAnotherFile` |
| `SharedLinkCreationFailure` | `create_shared_link_with_settings` failed for a reason other than an existing link | `retry` |
| `SharedLinkAlreadyExists` | Internal signal only; adoption succeeded | never surfaced unless adoption then fails |
| `RateLimited` | HTTP 429; carries the wait duration from `Retry-After` and `retry_after` | `retry` with `afterMs` |
| `NetworkFailure` | `fetch` rejected without a response | `retry` |
| `CorsRestriction` | A cross-origin failure reaching the Dropbox API | `documentation` |
| `CspRestriction` | A media element failed to load because of the host page's Content-Security-Policy | `documentation` |
| `DropboxOutage` | 5xx after the retry bound | `retry` |
| `UrlValidationFailure` | The canonical URL failed its media-element probe | `chooseAnotherFile` |
| `UnsupportedFoundryVersion` | The running Foundry version is outside the compatibility matrix | `documentation` |
| `FoundryIntegrationFailure` | The target sheet or field could not be located | `none` |
| `CursorExpired` | `list_folder/continue` returned `reset` | handled transparently; a restart, not a message |
| `Cancelled` | An `AbortSignal` fired | never shown |

## Dropbox-tag mapping

The transport owns this table; nothing else may reproduce it.

| Dropbox signal | Code |
|---|---|
| 401 `expired_access_token` | `AuthorizationExpired` after one refresh attempt fails |
| 401 `invalid_access_token`, `user_suspended`, `route_access_denied` | `TokenRefreshFailure` — no refresh attempted |
| 409 `path/not_found` | `FileDeleted` or `FolderDeleted` by context |
| 409 `reset` | `CursorExpired` |
| 409 `shared_link_already_exists` | `SharedLinkAlreadyExists` (internal) |
| 409 `email_not_verified`, `settings_error`, `access_denied`, `banned_member`, `too_many_shared_folders` | `SharedLinkCreationFailure` with a distinct `i18nKey` per tag |
| 409 `too_many_files` (thumbnails) | a programming error: the batch builder must never exceed 25 |
| 429 any | `RateLimited` |
