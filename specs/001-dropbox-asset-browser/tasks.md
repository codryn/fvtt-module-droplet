# Tasks: Dropbox Asset Browser

**Input**: Design documents from `/specs/001-dropbox-asset-browser/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature. The constitution requires automated coverage for security-sensitive, persistence-sensitive, compatibility-sensitive, and regression-prone behavior, plus manual compatibility evidence for Foundry, Forge, and browser-specific risks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently once the shared foundation is in place.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the repository, build, validation, and release scaffolding used by every later phase.

- [ ] T001 Create the TypeScript and Vite module scaffold in package.json, tsconfig.json, vite.config.ts, and .gitignore
- [ ] T002 Create the baseline Foundry manifest and localization files in static/module.json and static/lang/en.json
- [ ] T003 [P] Configure linting, formatting, unit tests, and browser tests in eslint.config.js, .prettierrc, vitest.config.ts, and playwright.config.ts
- [ ] T004 [P] Create the planned source and test entrypoints in src/module.ts, tests/unit/.gitkeep, tests/integration/.gitkeep, and tests/fixtures/.gitkeep
- [ ] T005 [P] Create CI, release, and dependency-update automation in .github/workflows/ci.yml, .github/workflows/release.yml, and .github/dependabot.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared contracts, adapters, settings, diagnostics, and bootstrap seams that all user stories depend on.

**⚠️ CRITICAL**: No user story work should start before this phase is complete.

- [ ] T006 Define shared constants and core types in src/constants.ts, src/types/errors.ts, and src/types/settings.ts
- [ ] T007 [P] Implement Foundry adapter contracts and version selection seams in src/foundry/FoundryAdapter.ts, src/foundry/selectAdapter.ts, src/foundry/UnsupportedVersionAdapter.ts, src/foundry/v14/FoundryV14Adapter.ts, and src/foundry/v13/FoundryV13Adapter.ts
- [ ] T008 [P] Register validated settings and a settings application shell in src/settings/registerSettings.ts, src/settings/validators.ts, and src/settings/DropletSettingsApplication.ts
- [ ] T009 [P] Establish Dropbox transport, typed error, and rate-limit contracts in src/dropbox/DropboxClient.ts, src/dropbox/errors.ts, src/dropbox/rateLimit.ts, specs/001-dropbox-asset-browser/contracts/dropbox-client.md, and specs/001-dropbox-asset-browser/contracts/error-model.md
- [ ] T010 [P] Create localization helpers and baseline string accessors in src/localization/t.ts and static/lang/en.json
- [ ] T011 [P] Implement diagnostic redaction and logging foundations in src/diagnostics/Redactor.ts, src/diagnostics/Logger.ts, and src/diagnostics/DiagnosticsService.ts
- [ ] T012 [P] Capture Foundry and public module contracts in specs/001-dropbox-asset-browser/contracts/foundry-adapter.md and specs/001-dropbox-asset-browser/contracts/module-api.md
- [ ] T013 Wire module bootstrap, hook registration, adapter selection, and diagnostics startup in src/module.ts

**Checkpoint**: The module can load, choose an adapter, register settings, and expose the shared seams needed by story work.

---

## Phase 3: User Story 1 - Connect a Dropbox account (Priority: P1) 🎯 MVP

**Goal**: Let a Game Master connect and disconnect Dropbox with a secretless PKCE flow, clear GM-only controls, and explicit account/root visibility.

**Independent Test**: Install the module in a clean world, connect with a Dropbox app key, verify connected status and exposed root, then disconnect and confirm stored authorization data is removed without affecting existing asset references.

### Tests for User Story 1

- [ ] T014 [P] [US1] Add PKCE, verifier-binding, state-validation, and token-expiry unit tests in tests/unit/auth/Pkce.test.ts and tests/unit/auth/DropboxOAuthService.test.ts
- [ ] T015 [P] [US1] Add GM-only connect, reconnect, and disconnect integration coverage in tests/integration/settings/dropboxConnection.test.ts
- [ ] T016 [US1] Record OAuth and settings-scope research results for RS-01 to RS-03 in docs/research/oauth-code-display.md, docs/research/token-storage-scope.md, and docs/research/refresh-token-pkce.md

### Implementation for User Story 1

- [ ] T017 [P] [US1] Implement PKCE generation and client-scope credential persistence in src/auth/Pkce.ts and src/auth/CredentialStore.ts
- [ ] T018 [US1] Implement Dropbox connect, complete-connect, refresh, status, and disconnect flows in src/auth/DropboxOAuthService.ts and src/auth/authorizeUrl.ts
- [ ] T019 [US1] Build the settings UI for app key, access mode, offline access, connection status, and disconnect confirmation in src/settings/DropletSettingsApplication.ts and src/templates/droplet-settings.hbs
- [ ] T020 [US1] Enforce GM-only connection controls and localize connection warnings and status text in src/settings/registerSettings.ts, src/localization/t.ts, and static/lang/en.json

**Checkpoint**: A GM can authorize Dropbox, see status and root details, and disconnect cleanly.

---

## Phase 4: User Story 2 - Browse and filter Dropbox content (Priority: P1)

**Goal**: Let an authorized user browse the configured Dropbox root with breadcrumbs, filters, list/grid views, pagination, and lazy thumbnails without creating shareable links.

**Independent Test**: Open the browser on a connected account, navigate nested folders, switch list/grid views, filter by type and filename, and page through a large folder while confirming no shareable links are created during listing.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add root-enforcement and asset-classification unit coverage in tests/unit/domain/RootPathPolicy.test.ts and tests/unit/domain/AssetTypeClassifier.test.ts
- [ ] T022 [P] [US2] Add integration coverage for listing, breadcrumbs, filters, pagination, and zero link resolution during browsing in tests/integration/browser/dropboxBrowserListing.test.ts
- [ ] T023 [US2] Add manual navigation and large-folder validation notes in tests/manual/us2-browse-and-filter.md

### Implementation for User Story 2

- [ ] T024 [P] [US2] Implement root-path enforcement and supported-format classification in src/domain/RootPathPolicy.ts and src/domain/AssetTypeClassifier.ts
- [ ] T025 [P] [US2] Implement Dropbox listing and thumbnail transport methods in src/dropbox/DropboxHttpClient.ts and src/dropbox/DropboxClient.ts
- [ ] T026 [P] [US2] Implement browser state and thumbnail request coordination in src/browser/BrowserStore.ts and src/browser/thumbnailQueue.ts
- [ ] T027 [US2] Implement folder listing, pagination, refresh, and filter orchestration in src/services/BrowseService.ts and src/browser/DropboxBrowserApplication.ts
- [ ] T028 [US2] Build list/grid browser templates and styling in src/templates/dropbox-browser.hbs, src/templates/dropbox-browser-entry.hbs, and src/styles/droplet.css

**Checkpoint**: Users can browse, filter, and page Dropbox folders from within the configured root without triggering link creation.

---

## Phase 5: User Story 3 - Select an asset into a Foundry field (Priority: P1)

**Goal**: Add an additive Browse Dropbox flow for supported Foundry asset fields that returns a validated stable HTTPS URL only after explicit selection and confirmation.

**Independent Test**: Open Scene configuration, launch Browse Dropbox from the background field, preview and select an image, confirm the field receives a stable URL plus standard Foundry change events, and verify cancel leaves the field unchanged.

### Tests for User Story 3

- [ ] T029 [P] [US3] Add shared-link normalization, link-reuse, and URL-validation unit coverage in tests/unit/domain/sharedLinkUrl.test.ts and tests/unit/services/SharedLinkResolver.test.ts
- [ ] T030 [P] [US3] Add integration coverage for scene-field selection, cancel behavior, and validation failures in tests/integration/foundry/sceneAssetSelection.test.ts
- [ ] T031 [US3] Record shared-link, media-validation, and Forge CSP findings for RS-04 to RS-06 in docs/research/shared-link-normalization.md, docs/research/dropbox-media-validation.md, and docs/research/forge-csp.md

### Implementation for User Story 3

- [ ] T032 [P] [US3] Implement canonical shared-link normalization and media-element URL validation in src/domain/sharedLinkUrl.ts and src/services/AssetUrlValidator.ts
- [ ] T033 [P] [US3] Implement shared-link reuse, creation, and in-flight deduplication in src/services/SharedLinkResolver.ts and src/dropbox/DropboxHttpClient.ts
- [ ] T034 [P] [US3] Implement preview loading and selection-mode behavior in src/services/PreviewService.ts, src/browser/PreviewPanel.ts, and src/browser/DropboxBrowserApplication.ts
- [ ] T035 [US3] Implement additive Scene background integration and first-use warning flow in src/foundry/SceneAssetFieldIntegration.ts, src/module.ts, and static/lang/en.json

**Checkpoint**: A supported Foundry field can receive a validated stable Dropbox URL through an additive selection flow.

---

## Phase 6: User Story 4 - Players and long-lived references (Priority: P2)

**Goal**: Ensure selected Dropbox assets keep rendering for players and remain valid after token expiry or Dropbox disconnect.

**Independent Test**: Assign an asset as a GM, verify a player without Dropbox credentials can render it, then re-test after access expiry and after disconnecting the GM browser connection.

### Tests for User Story 4

- [ ] T036 [P] [US4] Add integration coverage for player rendering, expired-auth resilience, and disconnect persistence in tests/integration/foundry/playerAssetRendering.test.ts
- [ ] T037 [US4] Add manual GM/player compatibility validation notes in tests/manual/us4-player-long-lived-references.md

### Implementation for User Story 4

- [ ] T038 [P] [US4] Persist shared-link mappings independently of auth state in src/cache/SharedLinkCache.ts and src/services/SharedLinkResolver.ts
- [ ] T039 [P] [US4] Ensure disconnect and expired-auth flows preserve document values while clearing only client credentials in src/auth/DropboxOAuthService.ts and src/settings/DropletSettingsApplication.ts
- [ ] T040 [US4] Document per-browser connection scope and player-safe asset rendering in README.md, docs/research/compatibility.md, and static/lang/en.json

**Checkpoint**: Existing Dropbox-backed document references keep working for players regardless of current GM auth state.

---

## Phase 7: User Story 5 - Responsive behavior under load and repeat use (Priority: P2)

**Goal**: Keep browsing responsive across large libraries with bounded caching, explicit refresh, and disciplined retry behavior under rate limiting.

**Independent Test**: Revisit folders within the cache TTL, refresh after an external Dropbox change, simulate rate limiting, and verify the browser recovers without losing the user's place.

### Tests for User Story 5

- [ ] T041 [P] [US5] Add cache TTL, LRU eviction, and retry-scheduling unit coverage in tests/unit/cache/FolderCache.test.ts, tests/unit/cache/SharedLinkCache.test.ts, and tests/unit/dropbox/rateLimit.test.ts
- [ ] T042 [P] [US5] Add integration coverage for cache hits, explicit refresh, throttle recovery, and clear-cache actions in tests/integration/browser/cacheAndThrottle.test.ts
- [ ] T043 [US5] Add manual performance validation notes for 1,000-entry folders in tests/manual/us5-performance-and-repeat-use.md

### Implementation for User Story 5

- [ ] T044 [P] [US5] Implement bounded folder and thumbnail caches in src/cache/FolderCache.ts, src/cache/ThumbnailCache.ts, and src/cache/lru.ts
- [ ] T045 [P] [US5] Implement shared-link cache persistence, invalidation, and clear-cache controls in src/cache/SharedLinkCache.ts, src/settings/DropletSettingsApplication.ts, and src/diagnostics/DiagnosticsService.ts
- [ ] T046 [US5] Implement retry-after throttling, user feedback, and per-folder refresh behavior in src/dropbox/rateLimit.ts, src/services/BrowseService.ts, and src/browser/DropboxBrowserApplication.ts
- [ ] T047 [US5] Expose cache and performance settings in src/settings/registerSettings.ts, src/settings/DropletSettingsApplication.ts, and static/lang/en.json

**Checkpoint**: Large-folder browsing remains responsive, cached revisits are fast, and throttle handling is visible and recoverable.

---

## Phase 8: User Story 6 - Understandable failures (Priority: P3)

**Goal**: Surface distinct, actionable, non-destructive errors for connection, browsing, selection, compatibility, and host-policy failures while keeping native Foundry asset workflows intact.

**Independent Test**: Induce the listed failure modes against mocks and confirm each produces a distinct recovery message without altering existing Foundry document values.

### Tests for User Story 6

- [ ] T048 [P] [US6] Add Dropbox-error mapping and redacted-technical-detail unit coverage in tests/unit/dropbox/errors.test.ts and tests/unit/diagnostics/Redactor.test.ts
- [ ] T049 [P] [US6] Add integration coverage for not-connected, deleted-file, root-missing, expired-auth, and unsupported-version failures in tests/integration/errors/userFacingFailures.test.ts
- [ ] T050 [US6] Add manual failure-mode verification notes in tests/manual/us6-understandable-failures.md

### Implementation for User Story 6

- [ ] T051 [P] [US6] Expand the typed error catalog and recovery metadata in src/dropbox/errors.ts, src/types/errors.ts, and src/localization/t.ts
- [ ] T052 [P] [US6] Implement graceful unsupported-version and missing-field degradation in src/foundry/UnsupportedVersionAdapter.ts, src/foundry/selectAdapter.ts, and src/foundry/SceneAssetFieldIntegration.ts
- [ ] T053 [US6] Wire actionable error presentation across settings and browser flows in src/settings/DropletSettingsApplication.ts, src/browser/DropboxBrowserApplication.ts, and static/lang/en.json

**Checkpoint**: Users see clear next steps for each major failure path and can still fall back to native Foundry workflows.

---

## Phase 9: User Story 7 - Transparent security, privacy and diagnostics (Priority: P3)

**Goal**: Explain the module's storage and privacy model clearly, provide a redacted diagnostic report, and document the no-telemetry posture.

**Independent Test**: Review the settings page and generated diagnostic report in a connected world and confirm required environment details are present while tokens, PKCE values, and full shared URLs are absent.

### Tests for User Story 7

- [ ] T054 [P] [US7] Add diagnostic-report and secret-redaction coverage in tests/unit/diagnostics/DiagnosticsService.test.ts and tests/integration/settings/diagnosticsReport.test.ts
- [ ] T055 [US7] Add manual privacy and outbound-request review notes in tests/manual/us7-security-privacy-diagnostics.md

### Implementation for User Story 7

- [ ] T056 [P] [US7] Implement the diagnostic report application and review-before-copy flow in src/diagnostics/DiagnosticsApplication.ts, src/diagnostics/DiagnosticsService.ts, and src/templates/diagnostics-report.hbs
- [ ] T057 [P] [US7] Add settings explanations for storage scope, shared-link privacy, and no-telemetry guarantees in src/settings/DropletSettingsApplication.ts, src/templates/droplet-settings.hbs, and static/lang/en.json
- [ ] T058 [US7] Publish security and operator documentation in README.md, CONTRIBUTING.md, SECURITY.md, docs/adr/ADR-001-client-only.md, docs/adr/ADR-005-shared-links.md, and docs/research/compatibility.md

**Checkpoint**: Diagnostics are reviewable and redacted, and the module's privacy and support model is explicit in both UI and docs.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Close remaining release, documentation, and regression gaps that span multiple stories.

- [ ] T059 [P] Update implementation contracts and operator quickstart in specs/001-dropbox-asset-browser/contracts/foundry-adapter.md, specs/001-dropbox-asset-browser/contracts/module-api.md, and specs/001-dropbox-asset-browser/quickstart.md
- [ ] T060 Finalize packaging metadata, version consistency, and release artifact assertions in package.json, static/module.json, and .github/workflows/release.yml
- [ ] T061 [P] Add remaining regression fixtures and secret-shaped-string scanning in tests/fixtures/, tests/integration/, and .github/workflows/ci.yml
- [ ] T062 Run and record the cross-browser and host compatibility matrix in docs/research/compatibility.md and docs/research/forge-validation.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all user-story implementation.
- **Phases 3-9: User Stories** all depend on Phase 2, but some stories also rely on earlier story outputs as noted below.
- **Phase 10: Polish** depends on every story selected for the release scope.

### User Story Dependencies

- **US1** starts after Phase 2 and establishes the authentication and settings foundation required for real end-to-end Dropbox flows.
- **US2** starts after Phase 2 and can be developed against mocks, but end-to-end validation depends on US1.
- **US3** depends on US1 for authorized access and on US2 for the browser surface it extends into selection mode.
- **US4** depends on US3 because it validates the persistence guarantees of stable selected URLs.
- **US5** depends on US2 for browsing flows and on US3 for shared-link cache behavior.
- **US6** depends on Phase 2 and should be layered onto each implemented workflow as stories land.
- **US7** depends on Phase 2 and reaches full value after US1-US6 expose their final diagnostics and privacy states.

### Within Each User Story

- Tests and research tasks should be completed before the corresponding implementation tasks are considered done.
- Pure domain logic should land before orchestration services that depend on it.
- Services should land before UI integration that consumes them.
- Integration wiring should be the last step inside each story so it can attach to tested behavior.

### Parallel Opportunities

- `T003`, `T004`, and `T005` can run in parallel once `T001` and `T002` establish the package and manifest baseline.
- `T007` through `T012` can proceed in parallel during Phase 2 once the shared type direction in `T006` is settled.
- In US1, `T014` and `T015` can run in parallel, and `T017` can proceed while the research notes in `T016` are captured.
- In US2, `T024`, `T025`, and `T026` can proceed in parallel before `T027` integrates them.
- In US3, `T032`, `T033`, and `T034` can proceed in parallel before `T035` wires the Foundry field integration.
- In US5, `T044` and `T045` can proceed in parallel before `T046` connects throttle behavior to the browser.
- In US6 and US7, the `[P]` test and implementation tasks can be split across contributors because they touch separate files.

---

## Parallel Example: User Story 2

```text
Task: "T021 [US2] Add root-enforcement and asset-classification unit coverage in tests/unit/domain/RootPathPolicy.test.ts and tests/unit/domain/AssetTypeClassifier.test.ts"
Task: "T022 [US2] Add integration coverage for listing, breadcrumbs, filters, pagination, and zero link resolution during browsing in tests/integration/browser/dropboxBrowserListing.test.ts"
Task: "T024 [US2] Implement root-path enforcement and supported-format classification in src/domain/RootPathPolicy.ts and src/domain/AssetTypeClassifier.ts"
Task: "T025 [US2] Implement Dropbox listing and thumbnail transport methods in src/dropbox/DropboxHttpClient.ts and src/dropbox/DropboxClient.ts"
Task: "T026 [US2] Implement browser state and thumbnail request coordination in src/browser/BrowserStore.ts and src/browser/thumbnailQueue.ts"
```

## Parallel Example: User Story 3

```text
Task: "T029 [US3] Add shared-link normalization, link-reuse, and URL-validation unit coverage in tests/unit/domain/sharedLinkUrl.test.ts and tests/unit/services/SharedLinkResolver.test.ts"
Task: "T032 [US3] Implement canonical shared-link normalization and media-element URL validation in src/domain/sharedLinkUrl.ts and src/services/AssetUrlValidator.ts"
Task: "T033 [US3] Implement shared-link reuse, creation, and in-flight deduplication in src/services/SharedLinkResolver.ts and src/dropbox/DropboxHttpClient.ts"
Task: "T034 [US3] Implement preview loading and selection-mode behavior in src/services/PreviewService.ts, src/browser/PreviewPanel.ts, and src/browser/DropboxBrowserApplication.ts"
```

## Parallel Example: User Story 5

```text
Task: "T041 [US5] Add cache TTL, LRU eviction, and retry-scheduling unit coverage in tests/unit/cache/FolderCache.test.ts, tests/unit/cache/SharedLinkCache.test.ts, and tests/unit/dropbox/rateLimit.test.ts"
Task: "T044 [US5] Implement bounded folder and thumbnail caches in src/cache/FolderCache.ts, src/cache/ThumbnailCache.ts, and src/cache/lru.ts"
Task: "T045 [US5] Implement shared-link cache persistence, invalidation, and clear-cache controls in src/cache/SharedLinkCache.ts, src/settings/DropletSettingsApplication.ts, and src/diagnostics/DiagnosticsService.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 to prove the GM-only Dropbox connection flow.
3. Validate the auth and settings behavior before expanding scope.

### First End-to-End Usable Slice

1. Complete US2 after US1 so browsing works against a live connection.
2. Complete US3 so a Scene background field can receive a stable selected URL.
3. Treat US1-US3 together as the first user-visible release candidate.

### Incremental Delivery

1. Add US4 to validate player-safe, long-lived references.
2. Add US5 to harden performance and repeat-use behavior.
3. Add US6 and US7 to complete failure handling, diagnostics, and release-ready documentation.

---

## Notes

- Every task follows the required checklist format: checkbox, task ID, optional `[P]`, required story label for user-story tasks, and concrete file paths.
- Tests are intentionally explicit because the constitution requires evidence for security, persistence, compatibility, and regression-sensitive behavior.
- Research-spike documentation tasks are included where the plan identifies blockers or required empirical validation.