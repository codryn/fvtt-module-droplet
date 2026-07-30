# Phase 0 Research: Dropbox Asset Browser

**Feature**: 001-dropbox-asset-browser | **Date**: 2026-07-28 | **Plan**: [plan.md](plan.md)

Every decision below is either backed by an official source that was read during planning, or is
marked as an **open spike** with a concrete verification procedure. Nothing here is inferred from
a source that was not actually consulted. Where a source could not be reached, that is stated.

Sources consulted:

- Foundry VTT public API documentation, version **14.365 Stable** (`foundryvtt.com/api`):
  module `CONFIG`, module `hookEvents`, class `foundry.applications.apps.FilePicker`.
- Dropbox OAuth Guide (`developers.dropbox.com/oauth-guide`).
- **Dropbox HTTP API v2 reference (`dropbox.com/developers/documentation/http/documentation`),
  read in full during planning.** This covers the `/oauth2/authorize` and `/oauth2/token`
  endpoints, the `files` and `sharing` namespaces, the request/response and error datatypes, the
  "Errors by status code" table, and the "Browser-based JavaScript and CORS pre-flight requests"
  section. Every endpoint fact in this plan is now quoted from that page rather than recalled.
- Dropbox help article "Force a file or folder to download or render"
  (`help.dropbox.com/share/force-download`, updated 2025-06-30).

Sources attempted and unavailable at planning time:

- The Forge blog and community forum pages on external asset links returned HTTP 404. **No Forge
  CSP evidence was obtained.** This is recorded as release-gating spike RS-06 and must not be
  guessed.
- `dropbox.com/developers/reference/error-handling` returned HTTP 404. The error facts used here
  come from the "Errors" and "Errors by status code" sections of the HTTP reference itself, which
  were read successfully.

---

## RE-001 / Checkpoint 1 — OAuth redirect for Forge-hosted and self-hosted worlds

**Decision**: Ship the Dropbox authorization-code flow **without** a `redirect_uri` as the
default. Dropbox displays the authorization code on dropbox.com and the GM pastes it into a
Droplet dialog. Offer a registered-`redirect_uri` popup mode as an opt-in for GMs with a stable
world URL.

**Rationale**: The Dropbox OAuth Guide states that `redirect_uri` is optional with the code flow
and that, when it is omitted, the authorization code is displayed on dropbox.com for the user to
copy and paste — described as appropriate for apps that cannot support a redirect. Dropbox also
requires that any `redirect_uri` be pre-registered in the App Console and validates it exactly.
A Foundry world's URL varies by host, by Forge account, and by custom domain, so exact
pre-registration cannot be guaranteed for every installation. The code-display flow removes the
dependency entirely and behaves identically on Forge and self-hosted worlds. **Checkpoint 1 is
therefore answered and is not a blocker.**

**Alternatives considered**:

- Registered redirect to the world origin — works, but each GM must register their own URL, and
  it breaks when the world URL changes. Kept as an opt-in convenience mode.
- Loopback `http://localhost` redirect — designed for native apps; the Foundry client is a remote
  web page, so the loopback listener does not exist.
- A project-hosted redirect landing page — violates the no-backend constraint and would make the
  maintainers a party to every authorization.

**Consequence to fold back into the spec**: in code-display mode there is no `state` round trip
(FR-006). The equivalent binding is the in-memory PKCE verifier held by the open dialog; a paste
is refused when no verifier is pending. `state` is fully implemented and enforced in redirect
mode. Raised as risk R-08.

**Open spike RS-01**: complete the code-display flow end to end from a Forge-hosted world in
Chromium and Firefox, including a pop-up blocked case and a page reload mid-flow. Acceptance:
the connection succeeds, or the failure mode is documented with the exact browser behavior.

---

## RE-002 / Checkpoint 2 — Where tokens are stored, and whether players can read them

**Decision**: Store all authorization state in a Foundry setting registered with
`scope: "client"`. Never use `scope: "world"` for anything derived from a token. Never write
authorization state to a document.

**Rationale**: The project constitution explicitly forbids assuming that a GM-only settings form
keeps a world setting's *value* private. World settings are world data; client settings live in
the individual browser's storage. Choosing client scope makes the question moot for the design,
and reduces the blast radius to one browser.

**Alternatives considered**:

- World-scoped setting with a GM-only config form — rejected; it would place a refresh token in
  world data that is replicated to clients, and the constitution treats that as a stop condition.
- A hidden document or journal entry — strictly worse; documents are explicitly synchronized.
- `sessionStorage` — loses the connection on every reload, which contradicts the requirement that
  a GM not reconnect on every session.

**Open spike RS-02** (blocker for the documentation claim, not for the design): on both v14 and
v13, register one `scope: "world"` and one `scope: "client"` test setting containing a sentinel
string, connect as a non-GM player in a separate browser profile, and inspect the client's
in-memory settings collection and `localStorage` for the sentinel. Acceptance: written evidence
of whether each sentinel is visible to the player client, recorded in `docs/research/`. The
README's privacy claims may not be published before this is recorded.

---

## RE-003 / Checkpoint 3 — PKCE, short-lived tokens, and refresh grants without an app secret

**Decision**: Use the authorization-code flow with PKCE (`code_challenge_method=S256`) and no
client secret. Request `token_access_type=offline` to obtain a refresh token, and treat the
refresh token as **stored but not secret**.

**Rationale**: The Dropbox OAuth Guide names PKCE as the recommended solution for apps that
cannot keep a client secret secure, listing "single-page applications in pure JavaScript" and
"open source applications" explicitly. It specifies the verifier charset `[0-9a-zA-Z\-\._~]`
with a length between 43 and 128 characters and `S256` as the recommended challenge method. It
also documents that access tokens are short-lived and that `token_access_type=offline` is
required to receive a refresh token.

**Correction from the HTTP reference.** The prose OAuth Guide says to pass `code_verifier`
"instead of the `client_id`". The `/oauth2/token` endpoint reference contradicts that and is
authoritative: its PKCE example sends **both**, and no secret —
`code=…`, `grant_type=authorization_code`, `redirect_uri=…`, `code_verifier=…`, `client_id=…`.
The PKCE refresh example sends `grant_type=refresh_token`, `refresh_token=…`, `client_id=…`.
Droplet implements the endpoint-reference form. This discrepancy is exactly the kind of thing
RS-03 must confirm against the live service.

**Verified `/oauth2/authorize` and `/oauth2/token` facts** (HTTP reference):

- `code_challenge` is constrained to 43–128 characters; `code_verifier` on the token call is
  likewise `min_length=43, max_length=128`.
- `redirect_uri` "is required for the `token` flow, but optional for the `code` flow. If the
  redirect URI is omitted, the `code` will be presented directly to the user" — this is the
  primary-source confirmation for ADR-002.
- All redirect URIs must be HTTPS except `localhost`, and must match a registered URI exactly.
- `state` accepts up to 2000 bytes and is returned as a query parameter in code/PKCE flows.
- `scope` is space-separated; if omitted, the authorization page requests every scope enabled on
  the app's Permissions tab. Droplet therefore always sends an explicit `scope`, so a GM whose
  app has broader permissions still only grants Droplet's five.
- The token response carries `access_token`, `expires_in` (seconds; the documented example is
  `14400`, i.e. four hours), `token_type: "bearer"`, `scope`, and `account_id`.
- A refresh grant returns a new `access_token` and `expires_in` but **no new refresh token** —
  "refresh tokens don't expire automatically and can be reused repeatedly".
- `refresh_token_expiration_seconds` may be sent on the `authorization_code` grant to bound the
  refresh token's lifetime; omitting it means "valid indefinitely, until revoked". **Droplet's
  opt-in "stay connected" mode sets this**, so an abandoned browser profile stops being a
  standing grant. The exact bound is a settings value, defaulting to 30 days.
- The authorization page "should not be displayed in a web-view" — consistent with opening a
  real browser tab rather than an in-Foundry iframe.
- `token_access_type` defaults to `online` when omitted, which is precisely Droplet's default.

**Checkpoint 3 answer — no.** A client-side module cannot keep a refresh token meaningfully
secret. Notably, Dropbox's own recommendation table advises PKCE **without** refresh tokens for a
pure-JavaScript client-side web application, and reserves refresh tokens for desktop and mobile
apps that need background access. Droplet is a browser application, so the conservative reading
of Dropbox's guidance is short-lived access tokens with re-authorization.

**Resulting design**: offline access is **opt-in**, defaulting to off.

- Default (recommended, matches Dropbox's guidance for pure-JS clients): no `token_access_type`,
  short-lived access token only. The GM re-authorizes when it expires. Nothing long-lived is
  stored.
- Opt-in "stay connected": `token_access_type=offline`, refresh token stored in client scope,
  with an on-screen statement that it is readable by other scripts running in the same browser
  origin and that the mitigation is to revoke the app from Dropbox.

**Alternatives considered**: implicit flow (deprecated and returns a token in the URL fragment);
embedding a client secret (forbidden); a token-exchange backend (violates ADR-001).

**Open spike RS-03**: with a real development app, verify that a PKCE authorization with
`token_access_type=offline` and **no** secret returns a refresh token, and that
`grant_type=refresh_token` with only `client_id` and `refresh_token` succeeds. Acceptance:
recorded request/response shapes with all secrets redacted. If refresh without a secret fails,
the opt-in mode is dropped and only short-lived tokens ship.

---

## RE-004 / Checkpoints 6 and 8 — Shared-link formats and direct-content transformation

**Decision**: Persist the account's canonical shared link with `raw=1`, preserving `rlkey` and
every other query parameter. Normalization parses the URL, deletes any `dl` parameter, sets
`raw=1`, and re-serializes.

**Rationale**: The Dropbox help article documents `raw=1` as the parameter that bypasses the
preview page and allows the browser to render the file directly, and states it is available to
anyone with no restrictions. It documents `dl=1` as the force-download parameter, which is the
wrong behavior for `<img>`, `<audio>`, and `<video>`. It warns that shared links may already
carry query parameters such as `dl=0` and that developers must parse and modify rather than
append, and that links may redirect to a `dropbox.com/s/dl` form, so consumers must follow
redirects. The current link shape shown in that article is
`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=1`, confirming that `rlkey` is a
mandatory component that normalization must not drop.

**Alternatives considered**:

- `dl.dropboxusercontent.com` host rewriting — widely repeated but not documented in the article
  consulted. Rejected as an undocumented string hack.
- `files/get_temporary_link` — short-lived by definition, so persisting it violates the stable
  reference principle. Now excluded from previews as well; see RE-013.
- `dl=1` — forces a download disposition; wrong for media elements.

**Checkpoint 8 — privacy properties**: the link is a capability URL. `rlkey` is the capability
secret, and possession alone grants unauthenticated read access. Consequences enforced in the
design: warn the GM before the first selection; never print a full shared URL in logs or
diagnostics; document that revocation happens in Dropbox, not in Droplet.

**Open spike RS-04**: on a live account, create or list a shared link for an image, an audio
file, and a video; record the exact returned URL shape, the normalized URL, the observed HTTP
redirect chain, and the final content type, for both target browsers.

---

## RE-005 / RE-010 / Checkpoint 9 (part 1) — CORS behavior and cheap URL validation

**Decision**: Validate a resolved URL with a detached media element and **no** `crossOrigin`
attribute — `Image.decode()` for images, `preload="metadata"` plus `loadedmetadata` for audio and
video — under a timeout with an abort path. Do not use `fetch`, `HEAD`, or opaque `no-cors`
probes as the primary strategy.

**Rationale**: Media element loads are not subject to the CORS response-header requirement unless
`crossOrigin` is set, whereas `fetch` is. A `no-cors` fetch returns an opaque response that
cannot distinguish success from failure, so it produces no usable signal. A media-element probe
is also direct evidence for the actual consumer, because Foundry will render these assets through
the same element types. `preload="metadata"` avoids downloading whole files, which satisfies the
"validate without downloading the whole file" requirement.

**Alternatives considered**: `HEAD` via `fetch` (blocked without CORS headers, and Dropbox
redirects); Range requests (same CORS problem); trusting the URL without validation (fails the
requirement to detect broken references before persisting).

**Known limitation**: a probe failure alone cannot separate a CSP block from a broken asset. The
validator therefore runs a control probe against a known-good URL in the same session and reports
`CspOrCorsRestriction` only when both fail.

**Open spike RS-05**: measure, in both target browsers, whether the normalized `raw=1` URL loads
in `<img>`, `<audio>`, and `<video>`; whether `Image.decode()` resolves; and whether any CORS
error appears in the console. Record the results including the redirect chain.

---

## RE-006 / Checkpoint 9 (part 2) — The Forge's Content Security Policy — **UNRESOLVED RELEASE GATE**

**Status**: **Open. No evidence obtained.** The Forge documentation pages attempted during
planning returned HTTP 404. No claim about Forge's CSP appears anywhere in this plan.

**Why it gates release**: if The Forge sends a CSP that restricts `connect-src`, `img-src`, or
`media-src`, then either the Dropbox API calls, the asset rendering, or both fail on the primary
deployment target. No amount of client-side design can work around a CSP, and introducing a proxy
to do so is forbidden by ADR-001. The implementation can proceed against the self-hosted and
fixture-backed paths, but no Forge compatibility claim may ship until this evidence is recorded.

**Open spike RS-06** (required before Forge sign-off and release):

1. Load a Forge-hosted world and read the response headers of the world page and the
   `Content-Security-Policy` meta tag, if any.
2. From the world's console, attempt: a `fetch` to `https://api.dropboxapi.com/`, an `<img>` load
   from `https://www.dropbox.com/scl/fi/...?raw=1`, and an `<audio>` and `<video>` load from the
   same host family.
3. Record which of `connect-src`, `img-src`, and `media-src` permit `*.dropbox.com`,
   `*.dropboxusercontent.com`, `api.dropboxapi.com`, and `content.dropboxapi.com`.
4. Repeat with a Forge custom domain if available.

**Acceptance**: the observed policy and the four probe outcomes are recorded in
`docs/research/forge-csp.md`. **If Dropbox hosts are blocked, the honest outcomes are to
document the limitation and either narrow the supported hosting matrix or raise a request with
The Forge — not to introduce a proxy or a host-rewriting workaround.**

---

## RE-007 / Checkpoints 4 and 5 — Foundry v14 extension points, and v13 differences

**Decision**: Integrate additively through documented public hooks. Do not attempt to register a
Dropbox file-picker source. Do not patch core.

**Evidence from the v14.365 public API documentation**:

- `foundry.applications.apps.FilePicker` extends `ApplicationV2` with the Handlebars mixin.
- `FilePicker#sources` is typed `Record<"data" | "public" | "s3", { bucket?, buckets?, target }>`.
  That is a **closed literal union**, and `FilePicker.browse()` resolves paths through the Foundry
  server. **There is no public API to register a fourth source.** Checkpoint 5's premise is
  confirmed: the native path is unavailable, so the additive control is the required approach.
- `FilePicker` exposes a static accessor `implementation`, documented as retrieving "the
  configured FilePicker implementation", and the `CONFIG` module exposes a `CONFIG.ux` variable.
  Together these indicate a supported way to substitute a `FilePicker` subclass. This is a
  candidate for a future native-feeling Dropbox tab but is **not** used in release 1, because the
  server-backed `sources` model still has no Dropbox concept and subclassing would mean
  reimplementing browse behavior.
- The `hookEvents` module documents `renderApplicationV2` as a **generic** hook whose concrete
  name is derived from the calling class. `SceneConfig` is an `ApplicationV2` sheet, so
  `renderSceneConfig` is a documented public hook, not an invented one.
- Documented once-hooks in order: `init`, `i18nInit`, `setup`, `ready`. These are the lifecycle
  anchors Droplet uses.
- Other documented surfaces used: `foundry.applications.api.ApplicationV2`,
  `HandlebarsApplicationMixin`, `foundry.applications.api.DialogV2`,
  `foundry.helpers.ClientSettings`, `foundry.applications.ui.Notifications`, and
  `foundry.applications.settings.SettingsConfig`.

**Alternatives considered**: overriding `FilePicker.browse` (monkey-patching core, forbidden);
replacing the native picker button (breaks core behavior, forbidden); a scene-controls-only entry
point via `getSceneControlButtons` (kept as an additional launcher, but it does not solve
field-level selection).

**Open spike RS-07**: on a real v13 install, confirm that `renderSceneConfig` fires, whether the
handler receives a jQuery object or an `HTMLElement`, whether `SceneConfig` is ApplicationV1 or V2
in that generation, and the corresponding namespace paths. Acceptance: the v13 adapter is written
against observed behavior, or the v13 compatibility claim is withdrawn from `module.json`.

**Open spike RS-08** (post-release): determine whether assigning a `FilePicker` subclass to
`CONFIG.ux.FilePicker` is supported, when it must be assigned, and whether a Dropbox tab can be
added without reimplementing server-backed browsing.

---

## RE-008 — Listing, pagination, thumbnails, and rate limits

**Decision**: Page with `files/list_folder` plus `files/list_folder/continue`, fetch thumbnails
through `files/get_thumbnail_batch` lazily for visible rows only, **cap each thumbnail batch at
25 entries and in-flight batches at 2**, and treat HTTP 429 plus `Retry-After` as the source of
backoff timing.

**Rationale**: The success criterion requires the first page of a 1,000-entry folder within three
seconds, which rules out fetching the whole folder before rendering, and the constitution forbids
requesting more data than the visible view needs. Cursor-based continuation is the only paging
mechanism Dropbox offers for folder listing.

**Verified facts from the HTTP reference — RS-10 and RS-11 are now closed:**

| Fact | Verified value | Design consequence |
|---|---|---|
| `list_folder` host and scope | `api.dropboxapi.com/2/files/list_folder`, `files.metadata.read` | matches the endpoint matrix |
| `list_folder` `limit` | optional `UInt32(min=1, max=2000)`; "an approximate number and there can be slightly more entries returned in some cases" | the page renderer must tolerate `entries.length > limit`; a fixture covers this |
| Paging result | `entries`, `cursor` (`min_length=1`), `has_more` | unchanged |
| `recursive` | defaults to `false`; docs warn it "may lead to performance issues or errors" on large trees and recommend traversing one folder at a time | Droplet never sets `recursive` |
| `list_folder/continue` failure | `reset` — "the cursor has been invalidated. Call `list_folder` to obtain a new cursor." | `CursorExpired` maps to `reset` and triggers a transparent restart of that folder, not a user-facing error |
| Concurrency warning | "`RateLimitError` may be returned if multiple `list_folder` or `list_folder/continue` calls with same parameters are made simultaneously by same API app for same user… hold off the retry until the previous request finishes" | **single-flight is required for listing, not only for link creation.** `BrowseService` keys an in-flight promise by normalized path plus cursor and never issues a retry while a prior identical request is outstanding |
| `get_thumbnail_batch` host | **`content.dropboxapi.com/2/files/get_thumbnail_batch`**, RPC format, `files.content.read` | it is a content-host endpoint despite being RPC-shaped; a wrong host here is a silent misconfiguration the fixtures now pin |
| Batch ceiling | "We allow up to 25 thumbnails in a single batch"; `too_many_files` = "The operation involves more than 25 files" | hard cap of 25 per batch, enforced by a unit test |
| Source formats | jpg, jpeg, png, tiff, tif, gif, webp, ppm, bmp | files outside this set get a type icon, never a failed request |
| Size limit | "Photos that are larger than 20MB in size won't be converted to a thumbnail" | `size` from `list_folder` gates the request; over-limit files skip the batch |
| Thumbnail arguments | `format` (jpeg default, png, webp), `size` (`w64h64` etc.), `mode` (`strict` default), `quality` | Droplet requests `w128h128` jpeg, `mode: "strict"` |
| Response shape | per-entry `.tag: "success"`, `metadata`, and `thumbnail` as a **base64 string in JSON** | thumbnails arrive base64-encoded, not as binary; the decode-to-object-URL step is real work and belongs in `PreviewService`, and the thumbnail cache bound must account for base64's ~33 % overhead |
| `media_info` | "will not be set on entries returned by `list_folder`, `list_folder/continue`, or `get_thumbnail_batch`, starting December 2, 2019" | no image dimensions are available from listing; the UI must not promise them |
| `get_metadata` | "Metadata for the root folder is unsupported" | **root validation must not call `get_metadata` for the effective root when that root is `""`.** Root existence is proved with a `list_folder` call instead |
| 429 handling | "wait for the number of seconds specified in the `Retry-After` response header"; `RateLimitError` carries `reason` (`too_many_requests` / `too_many_write_operations`) and `retry_after` in seconds | as designed; both sources parsed, larger honored |
| 401 handling | `AuthError` tags include `expired_access_token`, `invalid_access_token`, `user_suspended`, `route_access_denied` | **`expired_access_token` triggers one silent refresh; `invalid_access_token` does not** — it means revoked or malformed and goes straight to re-authorization. Treating them alike would produce a refresh loop against a revoked grant |

**Alternatives considered**: `files/search_v2` for filtering (rejected — filtering happens on the
already-fetched page so that typing costs no request, per FR-020); per-file `get_thumbnail`
(rejected — batching reduces request count); prefetching all pages (rejected — violates the
listing budget).

**Residual open question RS-10a** (narrow, non-blocking): the reference does not state whether
`has_more` can be `true` alongside an empty `entries` array. The pager is written to treat that
combination as "continue", and a fixture asserts it does not terminate early or spin. Confirm
against live traffic during phase 4.

---

## RE-009 — Existing shared links, reuse, and concurrent creation

**Decision**: Resolve in this order — (1) shared-link cache by file id and rev; (2)
`sharing/list_shared_links` for the path with `direct_only: true`; (3)
`sharing/create_shared_link_with_settings` **with the `settings` field omitted**. Treat a
`shared_link_already_exists` failure as a success path: adopt the metadata carried in the error
if present, and only re-list if it is not. Deduplicate concurrent resolutions of the same file
behind a single in-flight promise keyed by file id and rev.

**Rationale**: FR-035 requires reusing an existing link rather than creating duplicates, and
SC-006 requires zero link operations during listing. Single-flight deduplication is the only way
to guarantee that a double click or two simultaneous selections do not race into two create calls.

**RS-12 is closed, and it changed the design.** The reference defines the error member as
`shared_link_already_exists` of type `SharedLinkAlreadyExistsMetadata?`, documented as: "The
shared link already exists. You can call `list_shared_links` to get the existing link, or use the
provided metadata if it is returned. **Existing link metadata will not be returned if custom
settings were specified in the request that could make the existing link incompatible with the
requested settings.**"

That sentence is the reason Droplet now sends **no** `settings` object on create. Droplet has no
requirement for a specific visibility, access level, or expiry — it wants *a* link — so
specifying settings would buy nothing and would forfeit the metadata that lets the conflict path
resolve in a single round trip. With `settings` omitted, the documented default visibility is
public, which is the same outcome the previous design requested explicitly. Net effect: the
happy-conflict path drops from two requests to one, and the extra `list_shared_links` call
becomes a fallback rather than the norm.

**Other verified facts**:

- `create_shared_link_with_settings` is `api.dropboxapi.com`, scope `sharing.write`. Its other
  error members are `path` (a `LookupError`), `email_not_verified`, `settings_error`,
  `access_denied` ("the file is restricted or the user's links are banned"), `banned_member`,
  and `too_many_shared_folders`. Each maps to a distinct, actionable `DropletError`;
  `email_not_verified` in particular has a concrete recovery the UI can state.
- `list_shared_links` is `api.dropboxapi.com`, scope `sharing.read`, and accepts `path`, `cursor`,
  and `direct_only`. Its result carries `links`, `has_more`, and a `cursor` that is "returned only
  if no path is given" — so the path-scoped call Droplet makes is single-shot by design, and any
  pagination loop written against it would be dead code.
- `sharing/get_shared_links` (the older route) is deprecated and "will be retired in October
  2026". Droplet uses `list_shared_links` and must never fall back to the retiring route.
- Revocation is `sharing/revoke_shared_link`, and the reference notes that a file may still be
  reachable through links on its parent folders. The README's revocation guidance must say so,
  otherwise it teaches GMs a false sense of removal.

**Alternatives considered**: always creating and ignoring the conflict (creates churn and can
produce user-visible duplicates in Dropbox); listing every link at connect time (unbounded and
wasteful); optimistic creation with retry (still races).

---

## RE-012 — Browser transport: CORS pre-flight, and why Droplet keeps the token out of the URL

**Decision**: Send Dropbox API calls as ordinary `POST` requests with an
`Authorization: Bearer …` header and `Content-Type: application/json`, accepting a CORS
pre-flight round trip. **Do not** adopt Dropbox's documented pre-flight-avoidance mode by
default.

**What the documentation offers**: the HTTP reference has a section, "Browser-based JavaScript
and CORS pre-flight requests", that describes how to make a request qualify as a "simple
cross-site request" and skip the pre-flight:

> - Use URL parameters `arg` and `authorization` instead of HTTP headers `Dropbox-API-Arg` and
>   `Authorization`.
> - Set the `Content-Type` to `"text/plain; charset=dropbox-cors-hack"` instead of
>   `"application/json"` or `"application/octet-stream"`.
> - Always set the URL parameter `reject_cors_preflight=true`.

This also confirms, as a side effect, that Dropbox intends and supports direct browser-to-API
calls — which is the load-bearing assumption under ADR-001.

**Why Droplet declines it by default**: the technique requires putting the access token in a
query string. Query strings land in browser history, in `Referer` headers on any subsequent
navigation, in intermediate proxy and CDN logs, and in crash and diagnostic dumps — none of which
are places a bearer token should be. Droplet's threat model already accepts that the token is
readable by same-origin scripts (T1, T10); it does not need to additionally scatter the token
into transport metadata to save one pre-flight per distinct request shape. Browsers cache
pre-flight results, so the cost is a small fixed overhead, not a per-request one.

**When it may be reconsidered**: only if RS-06 or RS-05 shows that pre-flight `OPTIONS` requests
are themselves blocked in a supported hosting environment. In that case the mode becomes a
functional necessity rather than an optimization, and it ships behind an explicit setting whose
description states the token-exposure trade-off in plain language. That decision must not be
taken silently.

**Open spike RS-13** (non-blocking): record, in both target browsers, whether the pre-flight
succeeds against `api.dropboxapi.com` and `content.dropboxapi.com` from a Foundry world origin,
and how long the pre-flight result is cached. Folds into RS-06's evidence file.

---

## RE-013 — `files/get_temporary_link` is not a preview transport

**Decision**: Do not use `files/get_temporary_link` to render previews. Previews use
`files/get_thumbnail_batch` for thumbnails and, for a full-size preview, the same canonical
shared link the selection would persist.

**Rationale — this reverses an earlier assumption.** The endpoint's own description reads: "Get a
temporary link to stream content of a file. This link will expire in four hours and afterwards
you will get 410 Gone. **This URL should not be used to display content directly in the
browser.**" The earlier plan listed the endpoint as a preview fallback, which the documentation
directly advises against. Persisting such a link was already forbidden; displaying one is now
also excluded.

**Consequence**: `PreviewService` has no `get_temporary_link` path, the endpoint leaves the
endpoint matrix entirely, and `files.content.read` remains required only for
`get_thumbnail_batch`. A file with no thumbnailable format shows a type icon and its metadata
rather than a fabricated preview.

**Noted alternative, not adopted in release 1**: `files/get_thumbnail_v2`
(`content.dropboxapi.com`) takes a `resource` union that accepts either a path **or a shared
link**, which would allow thumbnailing through an already-resolved link without a second path
lookup. It is a content-download endpoint returning binary rather than a JSON batch, so it does
not compose with the batching strategy. Recorded as a future option, not a release-1 dependency.

---

## RE-011 / RS-09 — Format support across browsers and Foundry

**Decision**: Classify by file extension, using any content-type hint only as a secondary signal,
and present classification as "recognized" rather than "guaranteed to play". SVG is recognized but
disabled by default (ADR-007).

**Rationale**: Recognition is a naming question and can be done offline; playability is a codec
and container question that varies by browser and by Foundry's own media handling. Conflating the
two would produce false promises, which the spec explicitly forbids.

**Open spike RS-09**: test AVIF, WebP, WebM, OGG, FLAC, and M4A in both target browsers inside a
real Foundry world, and record which are usable. Formats that fail are still listed but carry a
warning rather than being silently hidden.

---

## Additional decision — Dropbox app ownership

**Decision**: Keep the spec's assumption that each GM registers their own Dropbox application and
supplies the app key, and document the tension explicitly.

**Rationale**: The Dropbox OAuth Guide advises developers not to instruct users to register their
own application. However, Droplet has no backend and ships no secret, so a single shared app key
would place every installation's traffic under one app's rate limits and one app's review status,
with no operator able to respond to abuse. Per-GM apps also keep each GM's access under their own
control and make revocation a first-party action.

**Consequence**: the README must walk through App Console registration, permission selection, and
the development-versus-production app states, and must note that Dropbox's general guidance points
the other way and why Droplet diverges.

**Alternatives considered**: a shared published app key (concentrates rate limits and review risk
on a key the project cannot rotate per user); a backend that owns the app (violates ADR-001).

---

## Summary of blocker status

| Checkpoint | Question | Status |
|---|---|---|
| 1 | Reliable OAuth redirect to a Forge-hosted world | **Answered** — code-display flow; RS-01 confirms in practice |
| 2 | Where tokens are stored and whether players can read them | **Answered** — client scope only; RS-02 confirms the documentation claim |
| 3 | Can a client module keep a refresh token secret | **Answered — no**; offline access is opt-in and disclosed |
| 4 | Which v14 public APIs are used | **Answered** — enumerated from the 14.365 API docs |
| 5 | Fallback when file-picker source extension is unavailable | **Answered** — additive control; source registration confirmed unavailable |
| 6 | Which URL form is persisted | **Answered** — canonical shared link with `raw=1`, `rlkey` preserved; RS-04 confirms live |
| 7 | How existing links are detected and reused | **Answered** — cache, list, create without `settings`, adopt the conflict's inline metadata, re-list only when it is absent, single-flight |
| 8 | Privacy properties of those links | **Answered** — capability URLs; warned, redacted, revoked in Dropbox |
| 9 | Can assets load under Forge and browser CSP/CORS | **UNRESOLVED — RS-06 blocks Forge sign-off and release claims, not implementation** |
| 10 | How this is tested against a real Forge world | **Answered** — dedicated Forge world, throwaway Dropbox account, scripted checklist |

No `NEEDS CLARIFICATION` marker remains in the Technical Context. One release gate (RS-06) and a
set of confirmation spikes remain, each with a written procedure and acceptance criterion.

### Spike status after the HTTP-reference review

| Spike | Status |
|---|---|
| RS-10 (thumbnail limits, listing limits) | **Closed** — batch ceiling 25, 20 MB source cap, format list, `limit` max 2000 and approximate. One narrow follow-up, RS-10a, on `has_more` with empty `entries` |
| RS-11 (re-verify endpoints before writing fixtures) | **Closed** — the reference was read in full; hosts, scopes, arguments, and error unions are recorded above and fixtures may now be authored from them |
| RS-12 (already-exists payload) | **Closed** — the error carries the existing link metadata **provided no custom `settings` were sent**, which is why Droplet now omits `settings` |
| RS-13 (CORS pre-flight behavior) | **New, non-blocking** — folds into RS-06's evidence file |
| RS-06 (Forge CSP) | **Still open and still release-gating.** Two further source attempts during this review returned HTTP 404 and an unreadable page. No Forge CSP claim exists anywhere in this plan |

The review also produced four corrections rather than confirmations, which is the reason it was
worth doing: the PKCE token request sends `client_id` **and** `code_verifier`;
`get_thumbnail_batch` lives on the **content** host; `get_temporary_link` must not be used to
display content in a browser; and `get_metadata` cannot be called on the root folder.
