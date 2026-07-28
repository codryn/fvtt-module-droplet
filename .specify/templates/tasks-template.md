---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. For this repository, tests are REQUIRED
for security-sensitive, persistence-sensitive, compatibility-sensitive, and regression
prone behavior defined by the constitution. Do not omit those tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Foundry module code: `src/`, `templates/`, `styles/`, `lang/`, `static/`
- Manifest and package metadata: `module.json`, `package.json`
- Tests and fixtures: `tests/unit/`, `tests/integration/`, `tests/fixtures/`,
  `tests/manual/`
- Architecture and research documentation: `docs/adr/`, `docs/research/`
- Adjust paths only if plan.md documents a different concrete structure.

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Establish Foundry module manifest, packaging, and release structure in module.json and package.json
- [ ] T005 [P] Implement Dropbox authentication, credential-storage, and redaction boundaries in src/adapters/dropbox/ and src/services/
- [ ] T006 [P] Create Foundry compatibility adapter and asset-field integration seams in src/adapters/foundry/ and src/ui/
- [ ] T007 Create typed error, localization, and shared constants infrastructure in src/types/, src/localization/, and lang/
- [ ] T008 Configure diagnostics, cache, and root-path policy infrastructure in src/diagnostics/, src/cache/, and src/domain/
- [ ] T009 Capture blocking integration research or ADR decisions in docs/research/ and docs/adr/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Include
> unit, integration, and manual validation tasks when the story touches security,
> stable URLs, compatibility adapters, or error handling.**

- [ ] T010 [P] [US1] Add unit coverage for the critical domain rule in tests/unit/[name].test.ts
- [ ] T011 [P] [US1] Add integration coverage for the user journey in tests/integration/[name].test.ts
- [ ] T012 [US1] Add manual validation notes for Foundry/Forge/browser checks in tests/manual/[name].md

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create or update the domain model in src/domain/[entity].ts
- [ ] T014 [P] [US1] Implement the supporting service in src/services/[service].ts
- [ ] T015 [US1] Implement the Foundry-facing integration in src/ui/[feature].ts
- [ ] T016 [US1] Add validation, typed errors, and localization updates in src/types/, src/services/, and lang/
- [ ] T017 [US1] Add diagnostics, cache, or adapter updates required by the story in src/diagnostics/, src/cache/, or src/adapters/

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Add unit coverage for the critical domain rule in tests/unit/[name].test.ts
- [ ] T019 [P] [US2] Add integration coverage for the user journey in tests/integration/[name].test.ts
- [ ] T020 [US2] Add manual validation notes for Foundry/Forge/browser checks in tests/manual/[name].md

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create or update the domain model in src/domain/[entity].ts
- [ ] T022 [US2] Implement the supporting service in src/services/[service].ts
- [ ] T023 [US2] Implement the Foundry-facing integration in src/ui/[feature].ts
- [ ] T024 [US2] Integrate with earlier story components and update localization or diagnostics as needed

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 ⚠️

- [ ] T025 [P] [US3] Add unit coverage for the critical domain rule in tests/unit/[name].test.ts
- [ ] T026 [P] [US3] Add integration coverage for the user journey in tests/integration/[name].test.ts
- [ ] T027 [US3] Add manual validation notes for Foundry/Forge/browser checks in tests/manual/[name].md

### Implementation for User Story 3

- [ ] T028 [P] [US3] Create or update the domain model in src/domain/[entity].ts
- [ ] T029 [US3] Implement the supporting service in src/services/[service].ts
- [ ] T030 [US3] Implement the Foundry-facing integration in src/ui/[feature].ts

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Update docs/, docs/adr/, and docs/research/ for shipped behavior and evidence
- [ ] TXXX Verify module.json, package metadata, and release packaging remain consistent
- [ ] TXXX Performance tuning and cache review across all stories
- [ ] TXXX [P] Add any remaining regression coverage in tests/unit/ and tests/integration/
- [ ] TXXX Security and diagnostics hardening review
- [ ] TXXX Run quickstart.md and manual compatibility validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
