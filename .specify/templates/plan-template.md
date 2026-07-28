# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Security and privacy gate: confirm OAuth authorization-code + PKCE, secret handling,
  redaction rules, scope minimization, and root-path enforcement assumptions; stop if any
  design depends on embedded secrets, insecure token claims, or unrestricted navigation.
- Stable-reference gate: confirm the feature never persists Dropbox temporary links and
  defines tested shared-link reuse and normalization behavior for every persisted asset
  URL.
- Foundry-compatibility gate: identify the exact Foundry v14 surfaces involved, document
  v13 impact where relevant, preserve the native file picker path, and isolate any
  undocumented integration behind a compatibility adapter with graceful failure.
- Architecture gate: map changes to the required service and adapter boundaries, keep UI,
  Foundry integration, Dropbox transport, cache, and typed-error responsibilities
  separated, and reject direct cross-layer shortcuts.
- Test-and-evidence gate: list required unit, integration, manual, Forge-hosted, browser,
  and self-hosted validation for the feature; unresolved CSP, CORS, OAuth, or token
  visibility questions block the plan until researched.
- Documentation-and-release gate: identify which README, setup, security, compatibility,
  troubleshooting, and release-note updates the feature will require.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── module/
├── adapters/
│   ├── foundry/
│   └── dropbox/
├── services/
├── domain/
├── ui/
├── cache/
├── diagnostics/
├── localization/
└── types/

lang/
templates/
styles/
static/

tests/
├── unit/
├── integration/
├── fixtures/
└── manual/

docs/
├── adr/
└── research/

module.json
package.json
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
