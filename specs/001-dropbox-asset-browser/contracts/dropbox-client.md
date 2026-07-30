# Contract: Dropbox transport

**Feature**: 001-dropbox-asset-browser | **Plan**: [../plan.md](../plan.md) |
**Evidence**: [../research.md](../research.md) RE-003, RE-008, RE-009, RE-012, RE-013

`DropboxHttpClient` is the only module in the codebase permitted to call `fetch`. Every fact
below is quoted from the Dropbox HTTP API v2 reference, which was read in full during Phase 0.
Fixtures are authored from this file; if a fixture and this file disagree, this file is wrong and
must be corrected against the live reference rather than the other way round.

## Hosts

| Host | Used for |
|---|---|
| `https://www.dropbox.com` | The authorization page only (`/oauth2/authorize`) |
| `https://api.dropboxapi.com` | `/oauth2/token`, and every RPC endpoint except thumbnails |
| `https://content.dropboxapi.com` | `/2/files/get_thumbnail_batch` |

The thumbnail-batch host is the trap worth stating twice: it is an RPC-shaped call that lives on
the **content** host. A client that routes it by shape rather than by an explicit table will send
it to `api.dropboxapi.com` and fail.

## Transport rules

- Method is always `POST`.
- `Authorization: Bearer <access token>` as a header, never as a URL parameter (ADR-010).
- `Content-Type: application/json` for RPC endpoints; the body is JSON, or omitted entirely for
  endpoints that take no arguments.
- A CORS pre-flight is expected and accepted. The documented pre-flight-avoidance mode is **not**
  used, because it requires the token in the query string.
- Every request accepts an `AbortSignal` and rejects with `Cancelled` when aborted.
- No request is retried more than three times, and link creation is retried at most once.

## Client surface

```ts
interface DropboxHttpClient {
  listFolder(args: ListFolderArgs, signal?: AbortSignal): Promise<ListFolderResult>;
  listFolderContinue(cursor: string, signal?: AbortSignal): Promise<ListFolderResult>;
  getMetadata(path: string, signal?: AbortSignal): Promise<EntryMetadata>;
  getThumbnailBatch(entries: ThumbnailRequest[], signal?: AbortSignal): Promise<ThumbnailResult[]>;
  listSharedLinks(path: string, signal?: AbortSignal): Promise<SharedLinkMetadata[]>;
  createSharedLink(path: string, signal?: AbortSignal): Promise<CreateSharedLinkOutcome>;
  getCurrentAccount(signal?: AbortSignal): Promise<AccountSummary>;
  revokeToken(signal?: AbortSignal): Promise<void>;
}
```

No method returns a raw Dropbox payload; each maps into a project-owned type. No method accepts a
Foundry global.

## `files/list_folder`

`POST https://api.dropboxapi.com/2/files/list_folder` — scope `files.metadata.read`.

Request fields Droplet sends:

| Field | Value | Constraint |
|---|---|---|
| `path` | the effective root, or a folder below it | `""` denotes the root |
| `limit` | `pageSize` | `UInt32`, min 1, max 2000 |
| `recursive` | never sent | defaults to `false`; the reference warns recursive listing "may lead to performance issues or errors" |

Response: `{ entries, cursor, has_more }`. `cursor` has `min_length=1`.

Two behaviours the client must honour:

1. **`limit` is approximate.** The reference states it is "an approximate number and there can be
   slightly more entries returned in some cases". The pager must accept `entries.length > limit`
   without truncating or erroring.
2. **Identical simultaneous calls are self-inflicted rate limiting.** The reference warns that a
   `RateLimitError` "may be returned if multiple `list_folder` or `list_folder/continue` calls
   with same parameters are made simultaneously by same API app for same user", and advises to
   "hold off the retry until the previous request finishes". Listing is therefore single-flighted
   on a key of normalized path plus cursor.

## `files/list_folder/continue`

`POST https://api.dropboxapi.com/2/files/list_folder/continue` — scope `files.metadata.read`,
body `{ cursor }`.

The `reset` error means "the cursor has been invalidated. Call `list_folder` to obtain a new
cursor." It maps to `CursorExpired` and is handled transparently: the current folder restarts
from page one. It is not surfaced as a user-facing failure.

Open question **RS-10a**: the reference does not state whether `has_more` can be `true` alongside
an empty `entries` array. The pager treats that combination as "keep going", and a fixture
asserts it neither terminates early nor spins.

## `files/get_metadata`

`POST https://api.dropboxapi.com/2/files/get_metadata` — scope `files.metadata.read`.

**Not usable for the root.** The reference states plainly that "Metadata for the root folder is
unsupported". Root existence is proved with a `list_folder` call instead. This endpoint is used
only to confirm or deny that a specific file or folder still exists.

## `files/get_thumbnail_batch`

`POST https://content.dropboxapi.com/2/files/get_thumbnail_batch` — scope `files.content.read`.

| Constraint | Value |
|---|---|
| Entries per call | **25 maximum** (`too_many_files`: "The operation involves more than 25 files") |
| Source formats | jpg, jpeg, png, tiff, tif, gif, webp, ppm, bmp |
| Source size | "Photos that are larger than 20MB in size won't be converted to a thumbnail" |
| `format` | `jpeg` (default), `png`, `webp` — Droplet sends `jpeg` |
| `size` | `w64h64` default — Droplet sends `w128h128` |
| `mode` | `strict` default — Droplet sends `strict` |

The client filters candidates by extension and by the `size` already returned from `list_folder`
before building a batch, so ineligible files never consume a slot.

Each response entry carries `.tag: "success"`, `metadata`, and `thumbnail` as a **base64 string
inside the JSON body**. Decoding to a `Blob` and creating an object URL is real work owned by
`PreviewService`, not by the client. The base64 form is discarded immediately.

`media_info` is not available here: the reference states it "will not be set on entries returned
by `list_folder`, `list_folder/continue`, or `get_thumbnail_batch`, starting December 2, 2019".
Droplet therefore never claims to know an image's pixel dimensions before it is loaded.

## `sharing/list_shared_links`

`POST https://api.dropboxapi.com/2/sharing/list_shared_links` — scope `sharing.read`.

Droplet always sends `{ path, direct_only: true }`. `direct_only` suppresses links that exist only
by virtue of a shared parent folder, which are not stable references to the file itself.

A `cursor` is "returned only if no path is given". Because Droplet always gives a path, the call
is single-shot and any pagination loop here would be dead code.

`sharing/get_shared_links` is deprecated and, per the reference, "will be retired in October
2026". It is never called.

## `sharing/create_shared_link_with_settings`

`POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings` — scope
`sharing.write`. Droplet sends `{ path }` and **deliberately omits `settings`** (ADR-011).

The reason is quoted directly from the reference's `shared_link_already_exists` error:

> The shared link already exists. You can call `list_shared_links` to get the existing link, or
> use the provided metadata if it is returned. Existing link metadata will not be returned if
> custom settings were specified in the request that could make the existing link incompatible
> with the requested settings.

Omitting `settings` therefore keeps the existing-link metadata available, turning the common
"link already exists" case into a single request. `list_shared_links` remains the fallback for the
case where metadata is absent.

Other documented create errors, each mapped to a distinct `DropletError`: `path` (a `LookupError`),
`email_not_verified`, `settings_error`, `access_denied`, `banned_member`,
`too_many_shared_folders`.

Note for the README rather than the client: `sharing/revoke_shared_link` does not remove access if
a link to a parent folder still exists.

## OAuth

`GET https://www.dropbox.com/oauth2/authorize` with `client_id`, `response_type=code`,
`code_challenge`, `code_challenge_method=S256`, an explicit `scope`, and `token_access_type`.

| Fact | Value |
|---|---|
| `code_challenge` | 43–128 characters |
| `code_verifier` | `min_length=43, max_length=128` |
| `redirect_uri` | "required for the `token` flow, but optional for the `code` flow. If the redirect URI is omitted, the `code` will be presented directly to the user" — this is what makes ADR-002's default mode possible |
| Redirect URIs | must be HTTPS except `localhost`, and must match exactly |
| `state` | up to 2000 bytes |
| `scope` | space-separated; **if omitted, every scope on the app's Permissions tab is requested**, so Droplet always sends it explicitly |
| Web views | the reference states the authorization page "should not be displayed in a web-view" |
| `token_access_type` | defaults to `online`; Droplet sends `offline` only when the GM opts in |

`POST https://api.dropboxapi.com/oauth2/token`:

- Authorization-code grant with PKCE sends `code`, `grant_type=authorization_code`,
  `redirect_uri` (redirect mode only), `code_verifier`, and `client_id`. **Both `client_id` and
  `code_verifier` are sent**; no client secret is sent. The prose OAuth guide says `code_verifier`
  is passed "instead of the `client_id`", but the endpoint reference's own PKCE example sends
  both, and the endpoint reference wins.
- Refresh sends `grant_type=refresh_token`, `refresh_token`, and `client_id`, and returns **no new
  refresh token**.
- The response carries `access_token`, `expires_in` (seconds; the documented example is `14400`,
  four hours), `token_type: "bearer"`, `scope`, and `account_id`.
- When "stay connected" is enabled, Droplet sends `refresh_token_expiration_seconds` on the
  authorization-code grant so the refresh token expires after 30 days rather than living
  indefinitely.

## Error mapping

The reference's "Errors by status code" section is the source for these.

| Status | Meaning | Client behaviour |
|---|---|---|
| 400 | Bad input parameter, plain-text body | `DropboxOutage` only if unexpected; otherwise a programming error surfaced in diagnostics |
| 401 | `AuthError` with a tag | `expired_access_token` → exactly one silent refresh; `invalid_access_token`, `user_suspended`, `route_access_denied` → straight to re-authorization, because refreshing against a revoked grant would loop |
| 403 | `AccessError` | `InsufficientScopes` or `AuthorizationDenied` |
| 409 | Endpoint-specific error union | mapped per endpoint, e.g. `shared_link_already_exists`, `reset`, `path/not_found` |
| 429 | `RateLimitError` | honour the `Retry-After` header and the body's `retry_after` seconds, taking the larger; `reason` is `too_many_requests` or `too_many_write_operations` |
| 5xx | Dropbox-side failure | `DropboxOutage`, retried with jitter within the attempt bound |

A 429 body may be plain text rather than JSON, so the header is the primary source and the body a
refinement.
