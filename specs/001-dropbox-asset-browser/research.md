# Phase 0 Research: Dropbox Asset Browser

**Feature**: 001-dropbox-asset-browser | **Date**: 2026-07-28 | **Plan**: [plan.md](plan.md)

Every decision below is either backed by an official source that was read during planning, or is
marked as an **open spike** with a concrete verification procedure. Nothing here is inferred from
a source that was not actually consulted. Where a source could not be reached, that is stated.

Sources consulted:

- Foundry VTT public API documentation, version **14.365 Stable** (`foundryvtt.com/api`):
  module `CONFIG`, module `hookEvents`, class `foundry.applications.apps.FilePicker`.
- Dropbox OAuth Guide (`developers.dropbox.com/oauth-guide`).
- Dropbox help article "Force a file or folder to download or render"
  (`help.dropbox.com/share/force-download`, updated 2025-06-30).

Sources attempted and unavailable at planning time:

- The Forge blog and community forum pages on external asset links returned HTTP 404. **No Forge
  CSP evidence was obtained.** This is recorded as blocking spike RS-06 and must not be guessed.
- The Dropbox HTTP API reference page could not be extracted (JavaScript-rendered). Endpoint
  names in the plan come from the OAuth guide's scope discussion and from long-standing published
  endpoint paths; **every request and response shape must be re-verified against the live HTTP
  reference before the corresponding fixture is written** (RS-11).

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
with a length between 43 and 128 characters, `S256` as the recommended challenge method, and that
the token request carries `code_verifier` in place of the client secret. It also documents that
access tokens are short-lived and that `token_access_type=offline` is required to receive a
refresh token.

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
  reference principle. Confined to previews only.
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

## RE-006 / Checkpoint 9 (part 2) — The Forge's Content Security Policy — **UNRESOLVED BLOCKER**

**Status**: **Open. No evidence obtained.** The Forge documentation pages attempted during
planning returned HTTP 404. No claim about Forge's CSP appears anywhere in this plan.

**Why it blocks**: if The Forge sends a CSP that restricts `connect-src`, `img-src`, or
`media-src`, then either the Dropbox API calls, the asset rendering, or both fail on the primary
deployment target. No amount of client-side design can work around a CSP, and introducing a proxy
to do so is forbidden by ADR-001.

**Open spike RS-06** (blocks phases 6 and 7):

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
through `files/get_thumbnail_batch` lazily for visible rows only, cap thumbnail concurrency at 6,
and treat HTTP 429 plus `error.retry_after` as the single source of backoff timing.

**Rationale**: The success criterion requires the first page of a 1,000-entry folder within three
seconds, which rules out fetching the whole folder before rendering, and the constitution forbids
requesting more data than the visible view needs. Cursor-based continuation is the only paging
mechanism Dropbox offers for folder listing.

**Alternatives considered**: `files/search_v2` for filtering (rejected — filtering happens on the
already-fetched page so that typing costs no request, per FR-020); per-file `get_thumbnail`
(rejected — batching reduces request count); prefetching all pages (rejected — violates the
listing budget).

**Open spike RS-10**: confirm `get_thumbnail_batch`'s maximum batch size, available sizes,
supported source formats, and per-call cost; confirm `list_folder`'s `limit` semantics and whether
`has_more` can be true with an empty `entries` array.

**Open spike RS-11**: re-verify every endpoint path, request body, and error body in the endpoint
matrix against the live Dropbox HTTP API reference before writing fixtures. The reference page
could not be read during planning, so no fixture may be authored from memory.

---

## RE-009 — Existing shared links, reuse, and concurrent creation

**Decision**: Resolve in this order — (1) shared-link cache by file id and rev; (2)
`sharing/list_shared_links` for the path with direct-only semantics; (3)
`sharing/create_shared_link_with_settings`. Treat a `shared_link_already_exists` failure as a
success path: re-list and adopt the existing link. Deduplicate concurrent resolutions of the same
file behind a single in-flight promise keyed by file id and rev.

**Rationale**: FR-035 requires reusing an existing link rather than creating duplicates, and
SC-006 requires zero link operations during listing. Single-flight deduplication is the only way
to guarantee that a double click or two simultaneous selections do not race into two create calls.

**Alternatives considered**: always creating and ignoring the conflict (creates churn and can
produce user-visible duplicates in Dropbox); listing every link at connect time (unbounded and
wasteful); optimistic creation with retry (still races).

**Open spike RS-12**: confirm the exact error tag and payload Dropbox returns when a link already
exists, and whether it carries the existing link metadata directly. If it does, adoption skips
the extra list call.

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
| 7 | How existing links are detected and reused | **Answered** — cache, list, create, adopt-on-conflict, single-flight |
| 8 | Privacy properties of those links | **Answered** — capability URLs; warned, redacted, revoked in Dropbox |
| 9 | Can assets load under Forge and browser CSP/CORS | **UNRESOLVED — RS-06 blocks phases 6 and 7** |
| 10 | How this is tested against a real Forge world | **Answered** — dedicated Forge world, throwaway Dropbox account, scripted checklist |

No `NEEDS CLARIFICATION` marker remains in the Technical Context. One blocker (RS-06) and a set of
confirmation spikes remain, each with a written procedure and acceptance criterion.
