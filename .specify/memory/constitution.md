<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles: placeholder template -> I-XVIII concrete project principles
- Added sections: Additional Constraints; Development Workflow
- Removed sections: none
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md
	- ✅ .specify/templates/spec-template.md
	- ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: none
-->

# Foundry VTT 'Droplet' Module Constitution

## Core Principles

### I. Security And Privacy By Design
Security and privacy are architectural requirements. The module MUST never hard-code or
commit Dropbox access tokens, refresh tokens, authorization codes, client secrets, test
credentials, account identifiers, or private URLs in source control, fixtures, build
artifacts, logs, docs, screenshots, or CI configuration. The module MUST NOT require or
embed a Dropbox application secret. OAuth MUST use authorization-code flow with PKCE,
state values MUST be unpredictable and validated, requested Dropbox scopes MUST be the
minimum needed, and App Folder access MUST be preferred over Full Dropbox access. Any
use of Full Dropbox access MUST be an explicit, documented configuration choice. Every
token reachable from browser-side JavaScript MUST be treated as potentially recoverable;
client-side storage MUST NOT be described as secure secret storage; GM-only settings MUST
NOT be assumed private from players or other modules without version-verified evidence.
Sensitive values MUST never appear in ordinary or diagnostic logs, and diagnostics MUST
redact tokens, authorization codes, PKCE values, account identifiers, and sensitive URL
parameters. The module MUST NOT add remote telemetry, analytics, crash reporting, usage
tracking, developer-controlled network calls, or transmission of asset metadata or module
usage to the developer. Dropbox metadata and filenames MUST be treated as untrusted
input, user-controlled values MUST be escaped before HTML insertion, Dropbox navigation
MUST be constrained to the configured root via service-layer enforcement, SVG support
MUST remain disabled by default unless a documented safe rendering strategy exists, and
security-sensitive changes MUST receive explicit review plus dedicated tests. Rationale:
browser-resident integrations operating on third-party content must assume hostile input
and observable client state.

### II. Stable Asset References
Foundry documents MUST never depend on temporary Dropbox download URLs. The module MUST
NOT persist Dropbox temporary-link API results in Foundry documents. Selected assets MUST
resolve to stable HTTPS URLs that remain usable after OAuth access tokens expire. The
module MUST reuse existing shared links where possible, MUST NOT create duplicate shared
links for the same asset, MUST handle concurrent attempts to create the same shared link
safely, and MUST isolate URL transformation behind documented logic covered by automated
tests against current Dropbox behavior. Existing Foundry asset URLs MUST NOT be changed
automatically, every new asset assignment MUST be an explicit user action or
confirmation, and disconnecting Dropbox MUST NOT invalidate previously saved Foundry
references unless Dropbox revokes or removes the underlying shared link. The UI MUST
explain that stable shared-link assets may be reachable by anyone holding the URL, and
the module MUST NOT claim that shared links provide private authenticated delivery.
Rationale: persisted asset references outlive sessions, tokens, and hosting changes.

### III. Preserve Foundry Core Behavior
The Dropbox integration is additive. Foundry's standard file picker and Forge Assets
workflow MUST remain available, and Dropbox failures MUST NOT block normal asset
selection. The module MUST prefer documented public Foundry APIs and hooks, MUST avoid
global monkey-patching, and MUST avoid prototype modification unless no supported
alternative exists. Every use of undocumented Foundry APIs, private methods, DOM
structure coupling, wrappers, or monkey patches MUST be isolated behind a compatibility
adapter with documented justification, compatibility risk, graceful failure mode, and a
targeted test. The module MUST NOT scan or modify unrelated input fields, MUST integrate
only with known asset-selection surfaces, MUST preserve Foundry form behavior including
dirty state, validation, and input or change events, MUST NEVER silently overwrite
existing document values, and MUST remain system-agnostic. When native extension points
are insufficient, the module MUST add a separate Browse Dropbox action instead of
replacing core behavior. Rationale: users must retain baseline Foundry workflows even if
the integration is absent or degraded.

### IV. Explicit Compatibility Boundaries
Compatibility claims MUST be evidence-based. The primary target is Foundry Virtual
Tabletop v14, and v13 is a secondary target where practical. The module manifest MUST
accurately declare minimum, maximum, and verified versions. Compatibility MUST NOT be
claimed from successful compilation alone; it requires execution on the actual Foundry
version. Foundry-version-specific behavior MUST be isolated behind adapters rather than
scattered version checks. Unsupported versions MUST fail gracefully with a clear message.
Chromium-based browsers and current Firefox MUST be tested. The Forge-hosted deployment
path MUST be tested explicitly, and self-hosted compatibility MUST NOT assume Forge-only
APIs. Browser, Foundry, Forge, Dropbox, CSP, and CORS behavior MUST be verified when
relevant rather than assumed, and release notes MUST document compatibility findings and
known limitations. Any unverified compatibility statement MUST be labeled unverified.
Rationale: Foundry hosting and browser behavior materially affect security and media
delivery.

### V. Architecture Before Integration Hacks
Implementation MUST separate domain logic from Foundry and Dropbox infrastructure. The
architecture MUST define and preserve module bootstrap, Foundry compatibility adapter,
Dropbox OAuth service, Dropbox API client, credential-storage abstraction, root-path
policy, folder-browser state, shared-link resolver, preview service, asset-field
integration, cache service, diagnostics service, localization, and a typed error model.
Dropbox API calls MUST NOT be made directly from UI components, Foundry APIs MUST NOT be
called directly from Dropbox-domain services, rendering MUST remain separate from browser
state and transport, URL resolution MUST remain separate from directory listing, cache
behavior MUST remain separate from Dropbox API semantics, external SDKs MUST be wrapped
behind project-owned interfaces, business logic MUST be testable without Foundry or live
Dropbox access, dependency direction MUST flow toward stable internal abstractions,
circular dependencies are prohibited, global mutable state MUST be minimized and
documented, and side effects MUST occur through explicit adapters or services. Rationale:
the integration will otherwise collapse into brittle cross-layer coupling.

### VI. Minimal Permissions And Minimal Exposure
Access MUST be limited in both Foundry and Dropbox. Only authorized Foundry users may
browse Dropbox, and only Game Masters may configure the Dropbox connection. Players MUST
NOT require Dropbox credentials to render already assigned assets and MUST NOT receive
Dropbox API tokens for that purpose. The configured root folder MUST be enforced on every
Dropbox path operation, and navigation above the root MUST be impossible through crafted
input, cached entries, breadcrumbs, API calls, or path normalization edge cases. The
module MUST expose only supported asset metadata needed by the interface, unsupported
files MUST remain hidden by default, and the first release MUST NOT offer delete, move,
upload, rename, or edit operations. Write permissions MUST NOT be requested except where
Dropbox requires them to create shared links, and shared-link creation MUST occur only
when previewing or selecting an asset with no usable existing link. Rationale: the safest
permission is the one never granted.

### VII. Performance And API Discipline
Dropbox API usage MUST be deliberate and bounded. Shared links MUST NOT be resolved while
merely listing a directory, and folder loading MUST NOT issue one API request per visible
file. Large folders MUST use Dropbox pagination and remain responsive for at least 1,000
entries. Thumbnails MUST load lazily with bounded concurrency, obsolete requests MUST be
canceled when navigation changes, rate limits and Retry-After values MUST be respected,
retries MUST be bounded and use backoff where appropriate, and the module MUST avoid
downloading whole audio or video files for ordinary browser display. Folder metadata MUST
be cached for a configurable short period, resolved shared links MUST be cached, caches
MUST be size-bounded and versioned where persisted, invalidation MUST be explicit, Game
Masters MUST be able to clear module caches, and binary asset data MUST NOT be persisted
unless explicitly required for a short-lived preview. Rationale: browser-hosted Foundry
clients must remain responsive under real-world Dropbox latency and limits.

### VIII. Typed Errors And Graceful Degradation
Failures MUST be visible, actionable, and non-destructive. Infrastructure failures MUST be
normalized into project-owned typed errors including at least not connected,
authorization denied, OAuth state mismatch, expired authorization, token refresh failure,
insufficient scopes, invalid application key, missing root folder, root-policy
violation, deleted file, deleted folder, unsupported media type, shared-link creation
failure, shared-link already exists, rate limiting, network failure, CORS restriction,
CSP restriction, Dropbox API outage, URL validation failure, unsupported Foundry version,
and Foundry integration failure. UI code MUST NOT depend on raw Dropbox error shapes.
User-facing errors MUST explain the problem and the available recovery action. Technical
detail MAY be exposed through diagnostics but MUST NOT disclose secrets. Dropbox failures
MUST NOT corrupt Foundry document data, the standard Foundry asset workflow MUST remain
usable during Dropbox issues, and loading, empty, partial, retry, and failure states MUST
be explicit. Failed background operations MUST NOT disappear silently. Catch-all exception
handling without classification and reporting is prohibited. Rationale: integrations fail
in many ways; opaque failure handling creates data loss and support debt.

### IX. Test-First Behavior For Critical Logic
Security-sensitive and persistence-sensitive behavior requires tests before completion.
Unit coverage MUST include path normalization, root enforcement, case behavior,
traversal prevention, file-type classification, pagination, cache expiration, cache
eviction, shared-link normalization, existing-link reuse, duplicate-link handling, OAuth
state validation, PKCE generation, token-expiry calculations, concurrent token refresh,
secret redaction, Dropbox error mapping, rate-limit scheduling, Foundry version
selection, and settings validation. Integration coverage MUST include folder navigation,
breadcrumbs, filename and asset filters, incremental loading, thumbnail lazy loading,
request cancellation, asset selection, URL insertion into Foundry fields, preserving
existing field values until confirmation, expired authorization, reconnection, deleted
assets, rate limiting, shared-link-already-exists handling, and graceful failure of
Foundry UI integration. Automated tests MUST NOT require a real Dropbox account by
default, MUST use deterministic fixtures or mocks, MUST NOT contain real credentials, and
critical defects MUST add regression tests. If code is untestable because of architecture,
it MUST be refactored unless the limitation is inherent to Foundry. Manual testing
supplements but never replaces automated validation. Rationale: these behaviors guard data
integrity and security boundaries.

### X. Evidence-Driven Technical Decisions
Uncertain external behavior MUST be investigated instead of guessed. Mandatory research
checkpoints include Forge-hosted OAuth redirects, Foundry settings token visibility,
player-client exposure of restricted settings, Dropbox PKCE and refresh-token behavior,
current Dropbox shared-link direct-content behavior, browser CORS behavior for Dropbox
media, Forge CSP behavior for Dropbox hosts, Foundry v14 asset-field and file-picker
APIs, Foundry v13 differences, remote SVG handling, and media-element URL validation.
Official Foundry, Forge, Dropbox, browser, and standards documentation MUST be preferred;
findings MUST be recorded in ADRs or research notes; verified facts MUST be distinguished
from assumptions; unresolved authentication, URL persistence, CSP, or CORS questions are
blockers; proof-of-concept spikes MUST be used where docs are insufficient; and
experimental code MUST be removed or clearly isolated before production release.
Rationale: undocumented integration assumptions create expensive rework and misleading
compatibility claims.

### XI. Minimal And Maintainable Dependencies
Dependencies create security and maintenance obligations. Runtime dependencies MUST remain
minimal, each runtime dependency MUST have a documented justification, browser-native APIs
and small internal abstractions MUST be preferred where practical, and the official
Dropbox SDK MUST be evaluated against a typed HTTP client before selection. Dependency
decisions MUST consider bundle size, browser support, security history, maintenance
activity, license, TypeScript support, OAuth support, and tree-shaking behavior. React,
Vue, or another frontend framework MUST NOT be introduced without a concrete need.
Trivial utility dependencies are prohibited, dependency versions MUST be locked through the
package-manager lockfile, automated dependency update proposals MUST be enabled, updates
MUST pass the full validation pipeline, unused dependencies MUST be removed promptly, and
runtime code MUST NOT depend on Node.js APIs unavailable in Foundry's browser context.
Rationale: browser modules accumulate risk faster than server software because every
dependency ships to user clients.

### XII. Clear And Localized User Experience
The user interface MUST communicate state, risk, and consequences clearly. All user-facing
strings MUST use Foundry localization files. English is required initially, and the
localization structure MUST support German without code changes. Hard-coded interface
strings in TypeScript are prohibited. The UI MUST support keyboard navigation and
accessible labels. Loading, empty, disconnected, error, and rate-limited states MUST be
visible. Shared-link privacy implications MUST be explained before first use and remain
available in settings. Disconnect actions MUST explain what data will be removed and what
asset links remain. Potentially destructive future actions require explicit confirmation.
Audio and video MUST NOT autoplay. File size, type, path, and modification metadata MUST
be presented consistently, and unsupported files MUST be clearly classified when
diagnostic display is enabled. The UI MUST NOT imply guarantees the architecture cannot
provide. Rationale: unclear UI copy leads directly to misconfiguration and misplaced trust.

### XIII. Observability Without Surveillance
Diagnostics MUST help users without collecting their data. Local structured logging MAY be
used, but verbose logging MUST be disabled by default and logs MUST use consistent
severity levels. Secrets and sensitive identifiers MUST be redacted before reaching the
logging layer. Diagnostics MUST include Foundry version, module version, browser type,
connection state, Dropbox API reachability, required-scope status, root-folder
accessibility, cache state, and selected compatibility adapter. Diagnostic reports MUST
exclude tokens, authorization codes, PKCE verifiers, full shared URLs, private filenames
unless explicitly requested, and personal Dropbox account data. Reports MUST be reviewable
before copying, and no diagnostic data may be transmitted automatically. Rationale:
supportability is mandatory, surveillance is forbidden.

### XIV. Reproducible Builds And Controlled Releases
Every distributed artifact MUST be traceable to reviewed source. The repository MUST use a
deterministic documented build command, and CI MUST run type checking, linting, testing,
and a production build. Release ZIP files MUST contain only runtime-required files and
MUST NOT include source maps with sensitive paths, local environment files, development
credentials, secret-bearing fixtures, editor-only configuration, or uncompiled source
unless intentionally distributed. The module manifest MUST point to the correct release
artifact. Versions MUST stay consistent across package metadata, module manifest, tags,
and release notes. Releases MUST come from tagged reviewed commits; unreviewed commits
MUST NOT auto-publish production releases; breaking changes MUST receive explicit release
warnings; security-relevant changes require security-focused review; and each release MUST
document supported Foundry versions, tested browsers, tested hosting environments, known
limitations, migration notes, and security implications. GitHub workflows MUST use
least-privilege permissions. Rationale: the release artifact is the product users install.

### XV. Documentation Is Part Of The Product
Features are incomplete without user and maintainer documentation. Required documentation
includes a README, installation guide, Dropbox application setup, OAuth redirect
configuration, Forge-specific setup, self-hosted setup, security and privacy model,
shared-link implications, supported media formats, troubleshooting, known limitations,
compatibility matrix, architecture overview, contributing guide, security policy, release
process, development setup, test strategy, and ADRs for major decisions. Documentation
MUST match implemented behavior, MUST NOT describe planned behavior as already shipped,
MUST use synthetic credentials and paths in examples, MUST call out security-sensitive
choices, MUST label undocumented-API workarounds clearly, MUST expose known limitations,
and MUST allow installation and configuration without reading source code. Documentation
defects that can cause insecure configuration are product defects. Rationale: secure,
compatible operation depends on accurate guidance.

### XVI. Scope Discipline
The first release MUST remain focused. In-scope capabilities are one Dropbox account, a
configured root, folder navigation, supported asset filtering, metadata display,
incremental thumbnails, previews where practical, stable shared-link resolution, explicit
asset selection, insertion into at least the Foundry Scene background field, preservation
of the normal Foundry file picker, plus settings, diagnostics, caching, and disconnect
behavior. Out of scope unless separately specified are uploads, deletions, moves, renames,
edits, Dropbox-to-Forge synchronization, mirroring into Foundry storage, background sync,
multiple Dropbox accounts, Dropbox Business team management, media conversion, image
optimization, content deduplication, a separate hosted backend, automatic replacement of
existing Foundry asset URLs, revoking shared links, full file-picker replacement, and
game-system-specific behavior. New scope MUST enter through an explicit reviewed
specification amendment. Rationale: a sharply bounded first release is required to keep
security and compatibility claims credible.

### XVII. Code Quality Standards
The codebase MUST remain readable, typed, and maintainable. TypeScript strict mode is
required. Avoiding any is mandatory; any unavoidable any usage MUST carry a comment that
explains the boundary. Public interfaces and non-obvious behavior MUST have concise
documentation. Functions and classes MUST have focused responsibilities. Composition MUST
be preferred over inheritance. Deeply nested control flow MUST be reduced or justified
because it obscures state transitions. Immutable data MUST be preferred where practical.
All
external input MUST be validated at the boundary. Known state transitions MUST be modeled
explicitly. Magic strings for settings, hooks, event names, and error categories are
prohibited; constants MUST be centralized. A consistent formatter and linter are required,
CI MUST allow no lint warnings unless explicitly waived, dead code and commented-out
implementations MUST NOT be committed, TODO comments MUST reference a concrete issue or
task, browser console output MUST NOT be the primary user notification channel, and every
feature flag MUST declare an owner, default, and removal criterion. Rationale: readable
code is the only sustainable base for multi-surface compatibility work.

### XVIII. Definition Of Done
A feature is complete only when behavior matches the approved specification, follows the
approved plan, preserves the applicable architecture boundaries, evaluates security
implications, includes and passes required tests, passes type checking, linting, and the
production build, localizes user-facing text, handles error states, keeps logs free of
sensitive values, updates documentation, records compatibility impact, completes required
manual testing, leaves no unresolved blocker hidden behind a TODO, demonstrates acceptance
scenarios, and allows reviewers to trace implementation back to the originating
requirement. Code completion alone does not satisfy done. Rationale: completion is a
release-readiness standard, not a coding milestone.

## Additional Constraints

- Project name: Foundry VTT 'Droplet' Module.
- Module name: Droplet.
- Repository location: public GitHub repository.
- Product type: Foundry Virtual Tabletop module integrating Dropbox as an external asset
	source.
- Primary deployment target: The Forge-hosted Foundry worlds.
- Secondary deployment target: self-hosted Foundry installations.
- Module structure MUST adhere to current Foundry VTT module-development documentation,
	including an accurate module manifest and packaging layout suitable for distribution.
- The module MUST allow authorized Game Masters to browse Dropbox assets and assign stable
	Dropbox-hosted asset URLs to Foundry documents without first uploading those files to
	Foundry local storage or Forge Assets.

## Development Workflow

- Specifications, plans, and tasks MUST include explicit security, compatibility,
	architecture, testing, and documentation gates derived from this constitution.
- Research notes or ADRs MUST be created for any unresolved Dropbox, Forge, browser, or
	Foundry integration question before implementation proceeds.
- Pull requests MUST identify the governing spec or task, summarize constitution-sensitive
	impacts, and call out any compatibility evidence gathered.
- Security-sensitive changes, OAuth changes, token-storage changes, shared-link handling,
	path enforcement, URL handling, and Foundry integration changes MUST include targeted
	regression tests and explicit reviewer attention.
- Release preparation MUST confirm module manifest accuracy, tested version ranges,
	release artifact contents, and documentation updates before publication.

## Governance

This constitution is the highest-level project policy. All specifications, plans,
research, implementation tasks, pull requests, and releases MUST comply with it.

Amendment procedure:

- Amendments MUST be explicit.
- Every amendment MUST record rationale, affected principles, compatibility impact,
	security impact, and migration impact.
- Amendments that weaken security, privacy, compatibility, or testing requirements require
	strong written justification.
- Temporary exceptions MUST state exact scope, owner, expiration or removal condition, and
	tracking issue.
- Silent exceptions are prohibited.

Versioning policy:

- The constitution uses semantic versioning.
- MAJOR increments apply to backward-incompatible governance changes, principle removals,
	or materially weaker guarantees.
- MINOR increments apply to new principles, new mandatory sections, or materially expanded
	governance requirements.
- PATCH increments apply to clarifications, wording improvements, and non-semantic edits.

Compliance review expectations:

- Constitution compliance MUST be reviewed during specification, clarification, planning,
	task generation, implementation, pull-request review, and release preparation.
- Every pull request MUST identify the spec or task it implements.
- Security-sensitive pull requests require explicit security review.
- Changes to OAuth, token storage, shared-link handling, path enforcement, URL handling,
	or Foundry integration require targeted regression tests.
- Architecture changes require an ADR.
- Dependency additions require written justification.
- Compatibility claims require evidence.

Conflict resolution:

1. Prevent credential or user-data exposure.
2. Preserve correct and stable Foundry document references.
3. Avoid breaking Foundry core behavior.
4. Maintain explicit compatibility boundaries.
5. Preserve correctness and testability.
6. Maintain acceptable performance.
7. Improve user convenience.

When a requested feature violates a higher-priority principle, it MUST be rejected,
deferred, or redesigned.

**Version**: 1.0.0 | **Ratified**: 2026-07-28 | **Last Amended**: 2026-07-28
