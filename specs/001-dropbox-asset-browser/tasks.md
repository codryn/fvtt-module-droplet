# Tasks: Dropbox Asset Browser

**Input**: Design documents from `/specs/001-dropbox-asset-browser/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/README.md), [quickstart.md](quickstart.md)

**Tests**: Required. The constitution mandates automated coverage for security-sensitive, persistence-sensitive, compatibility-sensitive, and regression-prone behavior, plus manual compatibility evidence for Foundry, Forge, and browser risks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently once the shared foundation exists.

**Grounding**: Every Dropbox request shape, limit, host, and error tag referenced below is specified in [contracts/dropbox-client.md](contracts/dropbox-client.md), which was written from the Dropbox HTTP API v2 reference. Do not re-derive them from memory while implementing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Close the gaps in the existing scaffold. `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc`, `static/module.json`, `static/lang/en.json`, and the CI and release workflows already exist; these tasks extend them rather than create them.

- [ ] T001 Configure the module build output, entry points, and path aliases in vite.config.ts, tsconfig.json, and package.json
- [ ] T002 Create the test tree and shared Vitest setup in tests/unit/.gitkeep, tests/integration/.gitkeep, tests/fixtures/.gitkeep, tests/manual/.gitkeep, and vitest.config.ts
- [ ] T003 [P] Add the import-boundary rule enforcing the five dependency rules from plan.md in eslint.config.js
- [ ] T004 [P] Add the lint rule banning `console.*` outside src/diagnostics/Logger.ts in eslint.config.js
- [ ] T005 [P] Complete the manifest fields — id, esmodules, styles, languages, compatibility range, `socket: false`, empty relationships — in static/module.json
- [ ] T006 [P] Extend CI to run lint, typecheck, unit tests, build, and a token-shaped-string scan over the repository in .github/workflows/ci.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the contracts, transport, adapters, settings, and diagnostics every story depends on.

**⚠️ CRITICAL**: No user story work starts before this phase completes.

- [ ] T007 Define shared constants and core types in src/constants.ts, src/types/errors.ts, and src/types/settings.ts
- [ ] T008 [P] Implement the FoundryAdapter interface, version selection, and the unsupported-version fallback in src/foundry/FoundryAdapter.ts, src/foundry/selectAdapter.ts, and src/foundry/UnsupportedVersionAdapter.ts
- [ ] T009 [P] Implement the v14 and v13 adapter shells in src/foundry/v14/FoundryV14Adapter.ts and src/foundry/v13/FoundryV13Adapter.ts
- [ ] T010 [P] Register and validate every settings key from data-model.md, including thumbnailBatchSize and thumbnailBatchesInFlight, in src/settings/registerSettings.ts and src/settings/validators.ts
- [ ] T011 [P] Define the DropboxClient interface and the explicit endpoint host table separating api.dropboxapi.com from content.dropboxapi.com in src/dropbox/DropboxClient.ts and src/dropbox/endpoints.ts
- [ ] T012 [P] Implement the DropletError hierarchy and the Dropbox status-and-tag mapping from contracts/error-model.md in src/dropbox/errors.ts and src/types/errors.ts
- [ ] T013 [P] Implement retry scheduling that honors the `Retry-After` header and the `RateLimitError.retry_after` body field, taking the larger, with bounded attempts in src/dropbox/rateLimit.ts
- [ ] T014 Implement the transport core — POST, `Authorization: Bearer` header, JSON body, abort support, host routing, and no token in any URL per ADR-010 — in src/dropbox/DropboxHttpClient.ts
- [ ] T015 [P] Implement localization helpers and baseline strings in src/localization/t.ts and static/lang/en.json
- [ ] T016 [P] Implement redaction, logging, and diagnostics foundations in src/diagnostics/Redactor.ts, src/diagnostics/Logger.ts, and src/diagnostics/DiagnosticsService.ts
- [ ] T017 [P] Author Dropbox request and response fixtures from contracts/dropbox-client.md, pinning hosts and error unions, in tests/fixtures/dropbox/
- [ ] T018 Wire bootstrap — adapter selection, settings registration, hook registration, diagnostics startup — in src/module.ts

**Checkpoint**: The module loads, selects an adapter, registers settings, and exposes the shared seams. No Dropbox request is issued during `init` or `ready`.

---

## Phase 3: User Story 1 - Connect a Dropbox account (Priority: P1) 🎯 MVP

**Goal**: A Game Master connects and disconnects Dropbox through a secretless PKCE flow, with GM-only controls and explicit visibility of which folder is exposed.

**Independent Test**: In a clean world, enter an app key, complete the code-display authorization, confirm connected status and the exposed root, then disconnect and confirm stored authorization data is gone while document values are untouched.

### Tests for User Story 1

- [ ] T019 [P] [US1] Add PKCE unit tests covering the verifier charset, the 43–128 length bound, and S256 challenge derivation in tests/unit/auth/Pkce.test.ts
- [ ] T020 [P] [US1] Add token-request contract tests asserting the PKCE exchange sends **both** `client_id` and `code_verifier` with no secret, and that refresh sends `grant_type=refresh_token` with `client_id`, in tests/unit/auth/tokenRequest.test.ts
- [ ] T021 [P] [US1] Add an authorize-URL test asserting the explicit five-scope list, `code_challenge_method=S256`, and the absence of `redirect_uri` in code-display mode in tests/unit/auth/authorizeUrl.test.ts
- [ ] T022 [P] [US1] Add tests asserting no world-scoped setting holds authentication state and that concurrent refreshes are serialized behind one in-flight promise in tests/unit/auth/CredentialStore.test.ts and tests/unit/auth/refreshSerialization.test.ts
- [ ] T023 [P] [US1] Add integration coverage for GM-only connect, code paste, state-mismatch rejection, reconnect, and disconnect in tests/integration/settings/dropboxConnection.test.ts
- [ ] T024 [US1] Record the RS-01, RS-02, and RS-03 spike outcomes in docs/research/oauth-code-display.md, docs/research/token-storage-scope.md, and docs/research/refresh-token-pkce.md

### Implementation for User Story 1

- [ ] T025 [P] [US1] Implement PKCE verifier, challenge, and state generation using crypto.getRandomValues in src/auth/Pkce.ts
- [ ] T026 [P] [US1] Implement client-scope credential persistence with explicit expiry handling in src/auth/CredentialStore.ts
- [ ] T027 [US1] Implement authorize-URL construction with an always-explicit scope list and the opt-in redirect mode in src/auth/authorizeUrl.ts
- [ ] T028 [US1] Implement connect, completeConnect, serialized refresh, the `expired_access_token` versus `invalid_access_token` split, `refresh_token_expiration_seconds` for opt-in offline access, and disconnect in src/auth/DropboxOAuthService.ts
- [ ] T029 [US1] Build the connection settings UI, GM gating, and status and warning copy in src/settings/DropletSettingsApplication.ts, src/templates/droplet-settings.hbs, and static/lang/en.json

**Checkpoint**: A GM authorizes Dropbox, sees status and the exposed root, and disconnects cleanly.

---

## Phase 4: User Story 2 - Browse and filter Dropbox content (Priority: P1)

**Goal**: An authorized user browses the configured root with breadcrumbs, filters, list and grid views, pagination, and lazy thumbnails, with zero shared-link operations during listing.

**Independent Test**: Navigate a nested tree on a connected account, switch views, filter by category and filename, page through a 1,000-entry folder, and confirm no shared link is created or resolved.

### Tests for User Story 2

- [ ] T030 [P] [US2] Add root-path unit tests for traversal, encoded segments, casing, NFC, and the rule that root existence is proved by `list_folder` rather than `get_metadata` in tests/unit/domain/RootPathPolicy.test.ts
- [ ] T031 [P] [US2] Add asset classification unit tests including the downgrade-only MIME rule and SVG exclusion in tests/unit/domain/AssetTypeClassifier.test.ts
- [ ] T032 [P] [US2] Add pager unit tests covering `entries.length > limit`, the `reset` cursor restart, and `has_more` true with empty `entries` (RS-10a) in tests/unit/services/BrowseServicePaging.test.ts
- [ ] T033 [P] [US2] Add a single-flight test asserting identical concurrent path-plus-cursor listings issue exactly one request in tests/unit/services/BrowseServiceSingleFlight.test.ts
- [ ] T034 [P] [US2] Add thumbnail batch tests for the content host, the 25-entry cap, extension and 20 MB eligibility filtering, and base64 decoding to an object URL in tests/unit/services/thumbnailBatch.test.ts
- [ ] T035 [P] [US2] Add integration coverage for listing, breadcrumbs, filters issuing zero requests, pagination, lazy thumbnails, abort on navigation, and zero link resolution in tests/integration/browser/dropboxBrowserListing.test.ts
- [ ] T036 [US2] Add manual large-folder and navigation validation notes in tests/manual/us2-browse-and-filter.md

### Implementation for User Story 2

- [ ] T037 [P] [US2] Implement normalize, resolveWithin, and isWithinRoot in src/domain/RootPathPolicy.ts
- [ ] T038 [P] [US2] Implement extension-authoritative classification in src/domain/AssetTypeClassifier.ts
- [ ] T039 [P] [US2] Implement listFolder, listFolderContinue, getMetadata, and getThumbnailBatch transport methods against the pinned hosts in src/dropbox/DropboxHttpClient.ts
- [ ] T040 [P] [US2] Implement browser state and a thumbnail queue bounded to 25 entries per batch and 2 batches in flight in src/browser/BrowserStore.ts and src/browser/thumbnailQueue.ts
- [ ] T041 [US2] Implement paged listing with single-flight keyed by path and cursor, transparent cursor-reset restart, root enforcement, and client-side filtering in src/services/BrowseService.ts
- [ ] T042 [US2] Implement base64 thumbnail decoding and object-URL lifetime management in src/services/PreviewService.ts
- [ ] T043 [US2] Build the browser application, list and grid templates, and styles in src/browser/DropboxBrowserApplication.ts, src/templates/dropbox-browser.hbs, src/templates/dropbox-browser-entry.hbs, and src/styles/droplet.css

**Checkpoint**: Browsing, filtering, and paging work inside the configured root without triggering link creation.

---

## Phase 5: User Story 3 - Select an asset into a Foundry field (Priority: P1)

**Goal**: An additive Browse Dropbox action on supported asset fields returns a validated, stable HTTPS URL only after explicit selection and confirmation.

**Independent Test**: From Scene configuration, launch Browse Dropbox on the background field, preview and select an image, confirm the field receives a stable URL plus normal Foundry change events, and confirm cancelling leaves the field unchanged.

### Tests for User Story 3

- [ ] T044 [P] [US3] Add shared-link normalization tests covering `dl` removal, `raw=1`, and `rlkey` preservation in tests/unit/domain/sharedLinkUrl.test.ts
- [ ] T045 [P] [US3] Add resolver tests for cache hit, list-then-create, create with `settings` omitted, adoption of the conflict's inline metadata, the re-list fallback when metadata is absent, and single-flight per file id and rev in tests/unit/services/SharedLinkResolver.test.ts
- [ ] T046 [P] [US3] Add URL validator tests including the control probe that separates a CSP or CORS block from a broken asset in tests/unit/services/AssetUrlValidator.test.ts
- [ ] T047 [P] [US3] Add a test asserting `files/get_temporary_link` appears nowhere in the transport or the resolver, per RE-013, in tests/unit/dropbox/endpointMatrix.test.ts
- [ ] T048 [P] [US3] Add integration coverage for scene-field selection, cancel leaving the field untouched, validation failure, and the acknowledged first-use privacy warning in tests/integration/foundry/sceneAssetSelection.test.ts
- [ ] T049 [US3] Record the RS-04, RS-05, RS-06, and RS-13 spike outcomes in docs/research/shared-link-normalization.md, docs/research/dropbox-media-validation.md, docs/research/forge-csp.md, and docs/research/cors-preflight.md

### Implementation for User Story 3

- [ ] T050 [P] [US3] Implement canonical raw-URL normalization by parsing and re-serializing in src/domain/sharedLinkUrl.ts
- [ ] T051 [P] [US3] Implement media-element URL validation with timeout, abort, and control probe in src/services/AssetUrlValidator.ts
- [ ] T052 [P] [US3] Implement listSharedLinks with `direct_only` and createSharedLink with `settings` omitted, parsing conflict metadata, in src/dropbox/DropboxHttpClient.ts
- [ ] T053 [US3] Implement cache-list-create-adopt resolution with single-flight per file id and rev in src/services/SharedLinkResolver.ts
- [ ] T054 [P] [US3] Implement preview panel and select-mode behavior with no temporary-link path in src/browser/PreviewPanel.ts and src/browser/DropboxBrowserApplication.ts
- [ ] T055 [US3] Implement descriptor-driven additive scene-field integration that locates the input by field name and dispatches bubbling input and change events without saving in src/foundry/SceneAssetFieldIntegration.ts and src/foundry/assetFieldDescriptors.ts
- [ ] T056 [US3] Expose the public API and emitted hooks from contracts/module-api.md in src/api.ts and src/module.ts

**Checkpoint**: A Scene background field receives a validated, stable Dropbox URL through an additive flow that never saves the document.

---

## Phase 6: User Story 4 - Players and long-lived references (Priority: P2)

**Goal**: Selected assets keep rendering for players and remain valid after token expiry and after disconnect.

**Independent Test**: Assign an asset as GM, render it as a player with no Dropbox session, then re-verify after expiring the token and after disconnecting.

### Tests for User Story 4

- [ ] T057 [P] [US4] Add integration coverage for player rendering without credentials, rendering after token expiry, and rendering after disconnect in tests/integration/foundry/playerAssetRendering.test.ts
- [ ] T058 [P] [US4] Add a test asserting a player client's stored state contains no access token, refresh token, or authorization code in tests/integration/settings/playerClientState.test.ts
- [ ] T059 [US4] Add manual GM and player validation notes in tests/manual/us4-player-long-lived-references.md

### Implementation for User Story 4

- [ ] T060 [P] [US4] Implement schema-versioned shared-link persistence that survives disconnect and discards on version mismatch in src/cache/SharedLinkCache.ts
- [ ] T061 [US4] Ensure disconnect clears only client credentials and leaves document values and link mappings intact in src/auth/DropboxOAuthService.ts and src/settings/DropletSettingsApplication.ts
- [ ] T062 [US4] Document per-browser connection scope and player-safe rendering in README.md and static/lang/en.json

**Checkpoint**: Existing Dropbox-backed references keep working for players regardless of the GM's current auth state.

---

## Phase 7: User Story 5 - Responsive behavior under load and repeat use (Priority: P2)

**Goal**: Large libraries stay responsive through bounded caching, explicit refresh, and disciplined throttle handling.

**Independent Test**: Revisit folders inside the cache TTL, refresh after an external change, simulate rate limiting, and confirm recovery without losing the user's place.

### Tests for User Story 5

- [ ] T063 [P] [US5] Add folder cache TTL and LRU eviction unit tests in tests/unit/cache/FolderCache.test.ts and tests/unit/cache/lru.test.ts
- [ ] T064 [P] [US5] Add thumbnail cache tests bounding by decoded size and asserting object-URL revocation on eviction and close in tests/unit/cache/ThumbnailCache.test.ts
- [ ] T065 [P] [US5] Add rate-limit scheduling tests covering the header, the body field, the larger-value rule, and the attempt bound in tests/unit/dropbox/rateLimit.test.ts
- [ ] T066 [P] [US5] Add integration coverage for cache hits, per-folder refresh, visible throttle state, recovery, and clear-cache in tests/integration/browser/cacheAndThrottle.test.ts
- [ ] T067 [US5] Add manual 1,000-entry performance validation notes in tests/manual/us5-performance-and-repeat-use.md

### Implementation for User Story 5

- [ ] T068 [P] [US5] Implement bounded folder and thumbnail caches in src/cache/FolderCache.ts, src/cache/ThumbnailCache.ts, and src/cache/lru.ts
- [ ] T069 [P] [US5] Implement clear-cache and per-folder refresh controls in src/settings/DropletSettingsApplication.ts and src/browser/DropboxBrowserApplication.ts
- [ ] T070 [US5] Wire throttle state and bounded retry into listing and link resolution in src/services/BrowseService.ts and src/services/SharedLinkResolver.ts
- [ ] T071 [US5] Expose cache and performance settings and their copy in src/settings/registerSettings.ts and static/lang/en.json

**Checkpoint**: Repeat navigation is fast, refresh is explicit, and throttling is visible and recoverable.

---

## Phase 8: User Story 6 - Understandable failures (Priority: P3)

**Goal**: Distinct, actionable, non-destructive errors across connection, browsing, selection, compatibility, and host-policy failures, with native Foundry workflows always intact.

**Independent Test**: Induce each failure against fixtures and confirm a distinct recovery message and no change to document values.

### Tests for User Story 6

- [ ] T072 [P] [US6] Add error-mapping tests covering every status code and tag in contracts/error-model.md, including the `expired_access_token` versus `invalid_access_token` split, in tests/unit/dropbox/errors.test.ts
- [ ] T073 [P] [US6] Add redaction tests asserting tokens, codes, verifiers, and full shared URLs never reach `technicalDetail` in tests/unit/diagnostics/Redactor.test.ts
- [ ] T074 [P] [US6] Add integration coverage for not connected, deleted file, missing root, expired auth, unsupported version, and transparent cursor-reset recovery in tests/integration/errors/userFacingFailures.test.ts
- [ ] T075 [US6] Add manual failure-mode verification notes in tests/manual/us6-understandable-failures.md

### Implementation for User Story 6

- [ ] T076 [P] [US6] Complete the typed error catalog and recovery actions in src/dropbox/errors.ts and src/types/errors.ts
- [ ] T077 [P] [US6] Implement unsupported-version and missing-field graceful degradation in src/foundry/UnsupportedVersionAdapter.ts and src/foundry/SceneAssetFieldIntegration.ts
- [ ] T078 [US6] Present localized errors and recovery actions across settings and browser surfaces in src/settings/DropletSettingsApplication.ts, src/browser/DropboxBrowserApplication.ts, and static/lang/en.json

**Checkpoint**: Every major failure path names the problem and the next action, and native asset selection still works.

---

## Phase 9: User Story 7 - Transparent security, privacy and diagnostics (Priority: P3)

**Goal**: The storage and privacy model is explicit, the diagnostic report is reviewable and redacted, and the no-telemetry posture is documented.

**Independent Test**: Read the settings page and a generated report in a connected world; confirm required environment detail is present and no secret is.

### Tests for User Story 7

- [ ] T079 [P] [US7] Add diagnostic report coverage asserting required fields present and secrets absent in tests/unit/diagnostics/DiagnosticsService.test.ts and tests/integration/settings/diagnosticsReport.test.ts
- [ ] T080 [P] [US7] Add a localization test asserting every DropletErrorCode has both a message and a recovery key and that en.json has no unused keys in tests/unit/localization/keys.test.ts
- [ ] T081 [US7] Add manual privacy and outbound-request review notes in tests/manual/us7-security-privacy-diagnostics.md

### Implementation for User Story 7

- [ ] T082 [P] [US7] Implement the diagnostics application and the review-before-copy flow in src/diagnostics/DiagnosticsApplication.ts and src/templates/diagnostics-report.hbs
- [ ] T083 [P] [US7] Add settings copy for storage scope, shared-link privacy, no telemetry, Full Dropbox, and SVG warnings in src/templates/droplet-settings.hbs and static/lang/en.json
- [ ] T084 [US7] Publish the security policy and threat-model summary in SECURITY.md and docs/research/token-storage-scope.md

**Checkpoint**: Diagnostics are redacted and reviewable, and the privacy model is stated in both UI and documentation.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Close release, documentation, and evidence gaps that span stories.

- [ ] T085 [P] Publish the README covering Dropbox app registration, why Droplet diverges from Dropbox's own-app guidance, shared-link privacy, and the caveat that revoking a file's link does not remove access while a parent-folder link exists, in README.md
- [ ] T086 [P] Publish ADR-001 through ADR-011 in docs/adr/
- [ ] T087 [P] Publish contributor guidance in CONTRIBUTING.md
- [ ] T088 Finalize manifest compatibility, version consistency, and release artifact assertions in static/module.json, package.json, and .github/workflows/release.yml
- [ ] T089 Run the quickstart validation and record the browser and host compatibility matrix in docs/research/compatibility.md
- [ ] T090 Resolve or explicitly withdraw the RS-06 Forge CSP claim and update specs/001-dropbox-asset-browser/research.md and specs/001-dropbox-asset-browser/plan.md to match the evidence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** has no dependencies.
- **Phase 2 (Foundational)** depends on Phase 1 and blocks all story work.
- **Phases 3–9 (Stories)** depend on Phase 2; additional inter-story dependencies are listed below.
- **Phase 10 (Polish)** depends on every story in the release scope.

### User Story Dependencies

- **US1** depends only on Phase 2. It is the MVP.
- **US2** depends on Phase 2 and can be built against fixtures; live validation needs US1.
- **US3** depends on US1 for authorized access and on US2 for the browser surface it extends.
- **US4** depends on US3, because it validates the persistence guarantee of the URLs US3 produces.
- **US5** depends on US2 for listing and on US3 for link caching.
- **US6** depends on Phase 2 and is layered onto each story as it lands.
- **US7** depends on Phase 2 and reaches full value once US1–US6 expose their final states.

### Blocking Research

- **RS-06 (Forge CSP)** is unresolved. It blocks sign-off on any Forge compatibility claim and on T089, but it blocks implementation of nothing.
- **T024** and **T049** gate publication of the compatibility and privacy claims in T085 and T089.

### Within Each Story

- Tests and research notes land before the matching implementation is considered done.
- Domain logic lands before the services that orchestrate it; services land before the UI that consumes them; Foundry wiring is last.

### Parallel Opportunities

- T003–T006 run in parallel after T001 and T002.
- T008–T017 run in parallel once T007 fixes the shared type direction; T014 and T018 are serialization points.
- In US1, T019–T023 run in parallel, and T025 and T026 proceed while T024 is recorded.
- In US2, T030–T035 run in parallel, then T037–T040 run in parallel before T041 integrates them.
- In US3, T044–T048 run in parallel, then T050, T051, T052, and T054 run in parallel before T053, T055, and T056.
- In US5, T063–T066 run in parallel, then T068 and T069 before T070.
- In Phase 10, T085, T086, and T087 are independent documents.

---

## Parallel Example: User Story 2

```text
Task: "T030 [US2] Add root-path unit tests ... in tests/unit/domain/RootPathPolicy.test.ts"
Task: "T031 [US2] Add asset classification unit tests ... in tests/unit/domain/AssetTypeClassifier.test.ts"
Task: "T032 [US2] Add pager unit tests ... in tests/unit/services/BrowseServicePaging.test.ts"
Task: "T033 [US2] Add a single-flight test ... in tests/unit/services/BrowseServiceSingleFlight.test.ts"
Task: "T034 [US2] Add thumbnail batch tests ... in tests/unit/services/thumbnailBatch.test.ts"
```

## Parallel Example: User Story 3

```text
Task: "T050 [US3] Implement canonical raw-URL normalization in src/domain/sharedLinkUrl.ts"
Task: "T051 [US3] Implement media-element URL validation in src/services/AssetUrlValidator.ts"
Task: "T052 [US3] Implement listSharedLinks and createSharedLink in src/dropbox/DropboxHttpClient.ts"
Task: "T054 [US3] Implement preview panel and select-mode behavior in src/browser/PreviewPanel.ts and src/browser/DropboxBrowserApplication.ts"
```

---

## Implementation Strategy

### MVP

Phase 1 → Phase 2 → **US1**. That proves a secretless, GM-only, client-scoped Dropbox connection, which is the assumption everything else rests on. Stop and validate before expanding.

### First usable slice

US1 → US2 → US3. Together these deliver the feature's actual purpose: a Scene background assigned from Dropbox with no upload step. Treat US1–US3 as the first release candidate.

### Incremental delivery

US4 proves the persistence guarantee, US5 hardens performance, and US6 and US7 complete failure handling, diagnostics, and release documentation.

### Do not ship until

RS-06 is either resolved with evidence or the Forge compatibility claim is explicitly withdrawn from the manifest and README. A compatibility claim never exercised on the actual host violates the constitution's evidence requirement.

---

## Summary

| Phase | Story | Tasks | Count |
|---|---|---|---|
| 1 | Setup | T001–T006 | 6 |
| 2 | Foundational | T007–T018 | 12 |
| 3 | US1 Connect (P1) | T019–T029 | 11 |
| 4 | US2 Browse (P1) | T030–T043 | 14 |
| 5 | US3 Select (P1) | T044–T056 | 13 |
| 6 | US4 Players (P2) | T057–T062 | 6 |
| 7 | US5 Load (P2) | T063–T071 | 9 |
| 8 | US6 Failures (P3) | T072–T078 | 7 |
| 9 | US7 Transparency (P3) | T079–T084 | 6 |
| 10 | Polish | T085–T090 | 6 |
| | **Total** | | **90** |
