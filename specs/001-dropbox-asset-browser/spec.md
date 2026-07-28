# Feature Specification: Dropbox Asset Browser

**Feature Branch**: `001-dropbox-asset-browser`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Build a Foundry Virtual Tabletop module that allows a Game Master to browse and select assets stored in a configured Dropbox folder directly from Foundry, without first uploading those assets to Foundry's local data storage or Forge Assets."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect a Dropbox account (Priority: P1)

A Game Master installs the module, opens its settings, enters a Dropbox application key,
starts an authorization flow, approves access in Dropbox, and returns to Foundry with a
connected account. The settings page then shows the connection status and states exactly
which Dropbox folder (app folder or configured root) is exposed. The Game Master can
disconnect at any time and is told what stored data is removed and what remains.

**Why this priority**: No other capability is reachable without an authorized connection.
It is the first thing a new user does and the first place trust is established or lost.

**Independent Test**: Can be fully tested by installing the module in a clean world,
entering an application key, completing authorization, observing connection status and the
exposed folder path, then disconnecting and confirming stored authorization data is gone.
Delivers value on its own by proving a secretless, GM-only Dropbox connection is possible.

**Acceptance Scenarios**:

1. **Given** a fresh installation with no Dropbox connection, **When** the Game Master
   opens module settings and enters a Dropbox application key and starts the connect
   action, **Then** an authorization flow begins and, on approval, the settings page shows
   a connected status and the name/path of the authorized root folder.
2. **Given** a connected account, **When** the Game Master triggers Disconnect, **Then**
   the module explains what will be removed, removes stored authorization data on
   confirmation, and returns to a disconnected status.
3. **Given** an authorization attempt whose returned state value does not match the value
   the module issued, **When** the flow completes, **Then** the module rejects the result,
   stores no authorization data, and shows an authorization-failure message.
4. **Given** a non-Game-Master user, **When** they open Foundry settings, **Then** the
   Dropbox connection controls and application key are not available to them.
5. **Given** access mode is left at its default, **When** the Game Master inspects
   settings, **Then** the mode is App Folder and choosing Full Dropbox requires an explicit
   change accompanied by a broader-access warning.

---

### User Story 2 - Browse and filter Dropbox content (Priority: P1)

An authorized user opens the Dropbox browser, sees folders and supported files in the
authorized root, navigates into nested folders, returns using breadcrumbs, switches
between a list view and a thumbnail grid, filters by asset category or filename, and loads
additional entries in large folders without the interface stalling.

**Why this priority**: Browsing is the core visual proof of concept and the surface every
later action depends on.

**Independent Test**: Can be fully tested against a connected account by navigating a
nested folder tree, applying category and filename filters, toggling views, and paging
through a folder with many entries — all without selecting an asset.

**Acceptance Scenarios**:

1. **Given** a connected account, **When** the user opens the Dropbox browser, **Then**
   folders and supported files in the authorized root are listed with folders clearly
   distinguished from files.
2. **Given** a folder listing, **When** the user opens a subfolder and then uses the
   breadcrumb trail, **Then** navigation returns to the correct ancestor folder.
3. **Given** a folder containing images, audio, video and unsupported files, **When** the
   user selects the Images category filter, **Then** only image files and folders remain
   visible.
4. **Given** a folder listing, **When** the user types part of a filename into the filter,
   **Then** only entries matching that text remain visible.
5. **Given** a folder containing at least 1,000 entries, **When** the user opens it,
   **Then** a first page renders promptly and further entries load incrementally on demand.
6. **Given** any folder listing, **When** the listing renders, **Then** no shareable asset
   links are created or resolved for the listed files.
7. **Given** the thumbnail grid view, **When** the user scrolls, **Then** thumbnails are
   requested only for entries that are or become visible, and requests for entries the user
   has navigated away from are abandoned.
8. **Given** a configured root folder restriction, **When** the user attempts to navigate
   above it by any means available in the interface, **Then** navigation is refused and the
   user remains at or below the configured root.
9. **Given** the default configuration, **When** a folder contains unsupported file types,
   **Then** those files are hidden; enabling the diagnostic display setting shows them
   marked as unsupported and non-selectable.

---

### User Story 3 - Select an asset into a Foundry field (Priority: P1)

While editing a Foundry document that accepts an asset path, the Game Master uses a
"Browse Dropbox" action next to the normal file picker, finds an asset, previews it,
confirms the selection, and the resulting stable HTTPS URL is written into the originating
field. The module warns, before the first such selection, that anyone holding the URL can
retrieve the asset.

**Why this priority**: This is the outcome the whole feature exists to deliver; without it
browsing is a demo rather than a tool.

**Independent Test**: Can be fully tested by opening a Scene configuration, using the
Browse Dropbox action on the background field, selecting an image, confirming, and
verifying the field now holds a working stable URL that renders when the scene is saved.

**Acceptance Scenarios**:

1. **Given** a supported asset field, **When** the Game Master opens it, **Then** a Browse
   Dropbox action appears alongside — not instead of — the standard Foundry file picker.
2. **Given** the Dropbox browser opened from a Scene background field, **When** the Game
   Master selects a WebP image and confirms, **Then** the field value becomes a stable
   HTTPS URL and the field reflects an unsaved change through normal Foundry behavior.
3. **Given** an asset that already has a usable shareable link, **When** it is selected,
   **Then** the existing link is reused and no additional link is created.
4. **Given** the same asset is selected a second time, **When** the URL is produced,
   **Then** it matches the previously produced URL and no duplicate link exists.
5. **Given** a produced URL, **When** the module validates it before returning, **Then** a
   URL that cannot be retrieved as direct media is rejected with an explanatory error and
   the field value is left unchanged.
6. **Given** the Game Master opens the browser but closes it without confirming a
   selection, **When** the dialog closes, **Then** the originating field retains its
   previous value and no document data is modified.
7. **Given** a first-time selection in a world, **When** the confirmation step is reached,
   **Then** a shared-link privacy warning is shown and must be acknowledged.

---

### User Story 4 - Players and long-lived references (Priority: P2)

A player with no Dropbox account joins the world and sees Dropbox-hosted scene backgrounds,
tokens, journal images and hears playlist audio. These continue to work after the Game
Master's Dropbox access token has expired and after the Game Master disconnects the
account.

**Why this priority**: It is the correctness guarantee that makes the feature safe to use
in a live game, but it is verified through outcomes produced by User Story 3.

**Independent Test**: Can be fully tested by assigning an asset as Game Master, then
joining as a player in a browser profile with no Dropbox session, and by re-verifying
rendering after invalidating the Game Master's access token and after disconnecting.

**Acceptance Scenarios**:

1. **Given** a scene whose background was assigned from Dropbox, **When** a player without
   any Dropbox account or login opens the scene, **Then** the background renders.
2. **Given** the Game Master's Dropbox access token has expired, **When** any user loads a
   document referencing a Dropbox-hosted asset, **Then** the asset still renders.
3. **Given** the Game Master disconnects Dropbox, **When** existing documents are loaded,
   **Then** their asset references are unchanged and continue to render.
4. **Given** any player client, **When** its stored client state is inspected, **Then** no
   Dropbox access token, refresh token, or authorization code is present.

---

### User Story 5 - Responsive behavior under load and repeat use (Priority: P2)

A Game Master works in a large media library across a session: revisiting folders is fast,
repeated navigation does not re-fetch everything, an explicit refresh picks up changes made
in Dropbox, and Dropbox rate limiting slows the module down rather than breaking it.

**Why this priority**: Real media libraries are large; without caching and rate-limit
discipline the browser becomes unusable and risks throttling the account.

**Independent Test**: Can be fully tested by navigating repeatedly between folders and
observing cached responses, refreshing a folder after an external change and seeing updated
contents, and simulating rate-limited responses to confirm the module waits and recovers.

**Acceptance Scenarios**:

1. **Given** a folder visited moments earlier, **When** the user returns to it within the
   configured cache period, **Then** it renders from cached metadata without re-listing.
2. **Given** a folder whose contents changed in Dropbox, **When** the user triggers
   refresh, **Then** cached metadata for that folder is discarded and current contents are
   shown.
3. **Given** Dropbox responds with a rate-limit signal and a retry delay, **When** the
   module continues, **Then** it waits at least the indicated delay, informs the user that
   it is throttled, and resumes without losing the user's place.
4. **Given** the Game Master triggers the clear-cache action, **When** it completes,
   **Then** cached folder metadata and cached link mappings are removed and existing
   document asset references are unaffected.

---

### User Story 6 - Understandable failures (Priority: P3)

When something goes wrong — not connected, denied or expired authorization, missing scopes,
a missing root folder, a deleted file, rate limiting, a network or content-policy block, an
unsupported media type, or a Dropbox outage — the user sees a message naming the problem and
the next action, and normal Foundry asset selection keeps working.

**Why this priority**: Essential for supportability and trust, but it hardens flows
delivered by earlier stories rather than adding new user capability.

**Independent Test**: Can be fully tested by inducing each failure condition against a test
double and confirming a distinct, actionable, non-destructive message in each case.

**Acceptance Scenarios**:

1. **Given** no Dropbox connection, **When** a user opens the Dropbox browser, **Then** a
   clear not-connected message with a path to the settings page is shown.
2. **Given** an asset that has been deleted in Dropbox, **When** the user tries to preview
   or select it, **Then** a clear "no longer available" message is shown and no field value
   changes.
3. **Given** a configured root folder that does not exist, **When** the browser opens,
   **Then** a message identifies the misconfigured root and points to the setting.
4. **Given** the authorization has expired and cannot be renewed, **When** any Dropbox
   operation is attempted, **Then** the user is told to reconnect and no partial or
   corrupted data is written.
5. **Given** any Dropbox failure state, **When** the user dismisses the message, **Then**
   the standard Foundry file picker and Forge asset workflow remain fully usable.

---

### User Story 7 - Transparent security, privacy and diagnostics (Priority: P3)

Before and after connecting, the Game Master can see what the module does and does not do:
that files are not copied into Foundry or Forge storage, that stable use relies on shareable
links reachable by URL holders, what data is stored locally, and how to remove it. A
diagnostic report can be generated, reviewed and copied without leaking secrets.

**Why this priority**: Required for informed consent and support, and mandated by project
policy, but it does not gate the core workflow.

**Independent Test**: Can be fully tested by reading the settings page and diagnostic output
in a connected world and confirming both the presence of the required explanations and the
absence of any sensitive value.

**Acceptance Scenarios**:

1. **Given** the settings page, **When** the Game Master reads it, **Then** it explains that
   selected files remain in Dropbox and are not copied into Foundry or Forge storage.
2. **Given** the diagnostic test action, **When** it runs, **Then** it reports module and
   Foundry version, connection state, Dropbox reachability, required-scope status,
   root-folder accessibility and cache state, and the report is shown for review before it
   can be copied.
3. **Given** any diagnostic report or log output, **When** it is inspected, **Then** it
   contains no access token, refresh token, authorization code, proof-key verifier, or full
   shareable URL.
4. **Given** normal operation, **When** outbound requests are observed, **Then** the module
   contacts only Dropbox endpoints and the Foundry host, and sends no usage data to the
   module developer.

---

### Edge Cases

- The authorization window is closed by the user before approval, or approval is denied.
- The authorization result arrives after the Foundry page has been reloaded.
- Two Dropbox operations attempt to refresh an expired authorization at the same time.
- Two selections of the same file happen concurrently and both try to create a link.
- A file already has a shareable link created outside the module, possibly with different
  settings or an expiry.
- A shareable link exists but the underlying file was moved or deleted afterwards.
- A folder or file name contains characters that would be interpreted as markup, path
  separators, or path traversal segments.
- Path casing differs between the configured root and the actual Dropbox path.
- The configured root folder is renamed or removed while the browser is open.
- Access mode is switched between App Folder and Full Dropbox while a connection exists.
- The Dropbox application key is changed while a connection exists.
- A folder contains only unsupported files, or is empty.
- A file's extension does not match its actual content type.
- A supported-by-name format the browser cannot decode (for example AVIF or a codec
  variant) is selected.
- The hosting environment's content-security policy blocks Dropbox content hosts.
- A cross-origin restriction prevents validation or rendering of an otherwise valid URL.
- Dropbox returns pagination cursors that expire mid-scroll.
- The user navigates away or closes the browser while thumbnail or preview requests are
  in flight.
- The module runs on a Foundry version outside the declared supported range.
- A second Game Master in the same world uses the browser at the same time.
- Foundry's asset-field markup differs between supported versions, so the Browse Dropbox
  action cannot be attached.

## Requirements *(mandatory)*

### Functional Requirements

#### Authorization and connection

- **FR-001**: Only a Game Master MUST be able to view or change the module's Dropbox
  connection settings, including the Dropbox application key and access mode.
- **FR-002**: The module MUST authorize Dropbox through an authorization-code flow with
  proof key for code exchange, using a Dropbox application key supplied through settings.
- **FR-003**: The module MUST NOT require, embed, or distribute a Dropbox application
  secret, access token, refresh token, authorization code, or developer account credential.
- **FR-004**: The module MUST request only the Dropbox permissions needed to list folder
  contents, read file metadata, retrieve thumbnails and previews, and read or create
  shareable links.
- **FR-005**: The module MUST default to App Folder access; selecting Full Dropbox access
  MUST require an explicit user change and MUST display a broader-access warning.
- **FR-006**: The module MUST generate an unpredictable authorization state value per
  attempt and MUST reject any authorization result whose state does not match.
- **FR-007**: The module MUST renew an expired access grant without user interaction when a
  renewal grant is available, and MUST serialize concurrent renewal attempts so that at most
  one renewal is in flight.
- **FR-008**: The module MUST provide a Disconnect action that states what will be removed,
  removes all locally stored authorization data on confirmation, and leaves existing Foundry
  document asset references untouched.
- **FR-009**: The module MUST persist only the minimum authorization state required to
  restore a connection, and MUST NOT present client-side storage as secure secret storage.
- **FR-010**: The module MUST display the current connection status and the exact Dropbox
  folder or application folder that is exposed.

#### Permissions and exposure

- **FR-011**: Only users holding the configured Foundry permission MUST be able to open the
  Dropbox browser; the default MUST grant this to Game Masters only.
- **FR-012**: Dropbox credentials, tokens, authorization codes, and connection settings MUST
  NOT be delivered to unauthorized clients through any module-controlled channel.
- **FR-013**: Users without Dropbox authorization MUST be able to render Dropbox-hosted
  assets already referenced by Foundry documents.
- **FR-014**: The first release MUST NOT offer upload, delete, move, rename, or edit
  operations against Dropbox content.

#### Browsing

- **FR-015**: The module MUST present folders and supported files of the current Dropbox
  folder, with folders visually distinguished from files.
- **FR-016**: The module MUST provide breadcrumb navigation reflecting the current path
  relative to the authorized root.
- **FR-017**: The module MUST provide both a list view and a thumbnail-grid view.
- **FR-018**: The module MUST display filename, asset type, file size, and modification date
  for each file where Dropbox supplies the value, and MUST indicate when a value is absent.
- **FR-019**: The module MUST allow filtering the current folder by asset category: images,
  audio, video, or all supported assets.
- **FR-020**: The module MUST allow filtering the current folder by filename text.
- **FR-021**: The module MUST load large folders through pagination or incremental loading
  and MUST remain interactive while additional entries load.
- **FR-022**: The module MUST hide unsupported files by default, and MUST provide a
  diagnostic setting that reveals them marked as unsupported and non-selectable.
- **FR-023**: The module MUST NOT create or resolve shareable links in order to render a
  folder listing.
- **FR-024**: The module MUST request thumbnails only for entries that are visible, MUST
  bound the number of concurrent thumbnail requests, and MUST abandon requests for entries
  the user has navigated away from.
- **FR-025**: The module MUST enforce the configured root on every Dropbox path operation
  and MUST make navigation above that root impossible through breadcrumbs, cached entries,
  filter input, or crafted path values.
- **FR-026**: The module MUST provide a per-folder refresh action that discards cached
  metadata for that folder before re-listing it.
- **FR-027**: The module MUST treat all Dropbox-supplied names, paths, and metadata as
  untrusted input and MUST render them without allowing markup or script execution.

#### Supported formats

- **FR-028**: The module MUST classify the following as supported: images PNG, JPEG, WebP,
  GIF and AVIF; audio MP3, OGG, WAV, FLAC and M4A; video WebM and MP4.
- **FR-029**: The module MUST recognize SVG as an image format but MUST exclude it by
  default; enabling SVG MUST require an explicit setting change accompanied by a warning
  that remote vector images carry additional risk.
- **FR-030**: The module MUST allow the Game Master to restrict which asset categories are
  browsable and selectable.
- **FR-031**: The module MUST state that a format being classified as supported does not
  guarantee that a given browser or Foundry version can display or play it.

#### Asset selection and stable references

- **FR-032**: Selecting and confirming an asset MUST produce a stable HTTPS URL suitable for
  storage in a Foundry document.
- **FR-033**: The produced URL MUST remain usable after the module's Dropbox access grant
  expires and after the account is disconnected, for as long as the underlying shareable
  link and file exist.
- **FR-034**: The module MUST reuse an existing shareable link for a file when one is usable,
  and MUST create at most one link per file.
- **FR-035**: The module MUST handle a link-already-exists outcome from concurrent creation
  attempts by adopting the existing link rather than failing or duplicating.
- **FR-036**: The module MUST convert Dropbox preview-page links into direct-content URLs
  usable by image, audio, and video elements, and MUST keep that conversion in one place so
  it can be revalidated when Dropbox behavior changes.
- **FR-037**: The module MUST validate that a produced URL retrieves usable media before
  returning it, and MUST report a validation failure rather than writing an unverified value.
- **FR-038**: The module MUST NOT store temporary Dropbox download links in Foundry
  documents or in any persistent module state.
- **FR-039**: The module MUST resolve a full asset URL only when the user previews or selects
  a specific file.
- **FR-040**: The module MUST warn, before the first asset is selected in a world and again
  in settings, that anyone who obtains a shareable URL can retrieve the asset.
- **FR-041**: The module MUST NOT modify any Foundry document or field value except as the
  direct result of an explicit user selection and confirmation.

#### Foundry integration

- **FR-042**: The module MUST add a Browse Dropbox action to supported Foundry
  asset-selection surfaces, including at minimum the Scene background field.
- **FR-043**: Confirming a selection MUST write the URL into the originating field and MUST
  preserve Foundry's normal form behavior, including change notification, validation, and
  unsaved-change state; the module MUST NOT save the document on the user's behalf.
- **FR-044**: The module MUST NOT replace, disable, or degrade Foundry's standard file
  picker or Forge asset workflows, and those workflows MUST remain fully usable when the
  module is disconnected, failing, or disabled.
- **FR-045**: The module MUST NOT scan or alter asset fields other than the known
  integration surfaces it explicitly supports.
- **FR-046**: The module MUST be system-agnostic and MUST NOT depend on any specific game
  system.
- **FR-047**: On an unsupported Foundry version, the module MUST show a clear message and
  disable its integration without producing errors that disrupt Foundry.
- **FR-048**: If the Browse Dropbox action cannot be attached to a given asset field, the
  module MUST fail silently for that field while leaving native behavior intact, and MUST
  record the condition in diagnostics.

#### Configuration

- **FR-049**: The module MUST provide a Game Master settings page exposing: Dropbox
  application key; access mode (App Folder or Full Dropbox); optional root folder
  restriction; allowed asset types; thumbnails enabled or disabled; thumbnail size or
  quality; maximum entries loaded per page; the shared-link security warning; connect and
  disconnect actions; connection status; and a diagnostic test action.
- **FR-050**: The module MUST validate settings input and MUST explain rejected values
  rather than failing later during Dropbox operations.
- **FR-051**: The module MUST provide an action that clears cached Dropbox metadata and
  cached link mappings without affecting stored Foundry document values.

#### Errors, resilience and rate limits

- **FR-052**: The module MUST present distinct, actionable messages for at least: not
  connected; authorization denied; authorization state mismatch; authorization expired and
  not renewable; insufficient permissions; invalid application key; configured root folder
  missing; root-policy violation; file or folder deleted; no usable shareable link;
  shareable link already exists; rate limiting; network failure; cross-origin restriction;
  content-policy restriction; unsupported media type; Dropbox service outage; URL validation
  failure; unsupported Foundry version; and Foundry integration failure.
- **FR-053**: The module MUST honor Dropbox rate-limit responses and any indicated retry
  delay, MUST bound retry attempts, and MUST inform the user while throttled.
- **FR-054**: A Dropbox failure MUST NOT corrupt, clear, or partially write Foundry document
  data.
- **FR-055**: The module MUST make loading, empty, partial, retrying, and failed states
  visible rather than leaving the interface blank or stalled.

#### Caching and performance

- **FR-056**: The module MUST cache folder metadata for a configurable short period and MUST
  cache resolved shareable links.
- **FR-057**: Caches MUST be size-bounded, MUST be invalidated on explicit refresh or clear,
  and MUST NOT retain binary asset data beyond short-lived preview needs.
- **FR-058**: The module MUST remain usable, including navigation and filtering, in folders
  containing at least 1,000 entries.

#### Privacy, logging and distribution

- **FR-059**: The module MUST NOT write access tokens, renewal tokens, authorization codes,
  proof-key values, or full shareable URLs to any log or diagnostic output.
- **FR-060**: The module MUST NOT send telemetry, analytics, usage data, or asset metadata to
  the module developer or any third party other than Dropbox.
- **FR-061**: The module MUST explain in its interface and documentation that selected files
  stay in Dropbox and are not copied into Foundry or Forge storage.
- **FR-062**: All user-facing text MUST come from localization files, with English provided
  initially and the structure able to accommodate additional languages without code changes.
- **FR-063**: The module MUST be installable through a standard Foundry module manifest URL
  and MUST declare its minimum, maximum, and verified Foundry versions accurately.

### Key Entities *(include if feature involves data)*

- **Dropbox Connection**: The authorized link between the world and one Dropbox account.
  Holds connection state, access mode, granted permissions, and the minimum renewal state.
  Exactly zero or one exists per Foundry world.
- **Authorized Root**: The effective folder boundary, derived from the access mode and the
  optional root restriction. Every path operation is evaluated against it.
- **Dropbox Entry**: A folder or file observed in a listing. Carries name, path relative to
  the authorized root, kind (folder or file), asset category, size, and modification date.
- **Asset Category**: The classification of a file as image, audio, video, or unsupported,
  used for filtering, display, and selectability.
- **Shareable Link Mapping**: The association between a Dropbox file identity and its stable
  direct-content URL, used to reuse links and prevent duplicates.
- **Browser State**: The user's current position and view — path, breadcrumb trail, view
  mode, active filters, loaded pages, and pending requests.
- **Module Settings**: The Game Master-owned configuration listed in FR-049.
- **Cache Entry**: A time-bounded, size-bounded stored result for folder metadata or a
  resolved link, with an explicit invalidation trigger.
- **Typed Error**: A module-owned classification of a failure, carrying a user-facing
  explanation, a recovery action, and non-sensitive technical detail for diagnostics.
- **Diagnostic Report**: A redacted, user-reviewable summary of environment and connection
  health that is never transmitted automatically.

## Security, Privacy & Compatibility Constraints *(mandatory)*

- **SCON-001**: The feature ships no Dropbox secret of any kind. Authorization uses an
  authorization-code flow with proof key for code exchange against a Game Master-supplied
  application key, so no application secret is needed in distributed code. All tokens
  reachable from browser JavaScript are treated as potentially recoverable, and no interface
  copy claims otherwise.
- **SCON-002**: Persisted Foundry references are always stable shareable-link URLs, never
  temporary download links. Links are reused, never duplicated, and disconnecting the
  account never rewrites or invalidates existing document values.
- **SCON-003**: Foundry v14 is the primary target and v13 is supported where APIs allow;
  Chromium-based browsers and current Firefox are supported; The Forge-hosted deployment must
  work with no filesystem access, container configuration, reverse proxy, or separate server.
  Any compatibility claim not exercised on the actual version and host is labeled unverified.
- **SCON-004**: The authorized root is enforced in the service layer on every path operation,
  not merely in the interface. Only Game Masters configure the connection and, by default,
  only Game Masters browse. Dropbox-supplied names and metadata are escaped before display.
  SVG is off by default. There is no remote telemetry of any kind.
- **SCON-005**: The integration is strictly additive: Foundry's native file picker and Forge
  Assets remain available at all times, and no document data changes without an explicit user
  selection and confirmation.

## Research & Evidence *(mandatory)*

- **RE-001**: How an OAuth redirect can complete reliably for a Forge-hosted Foundry world
  and for self-hosted installs, including which redirect targets Dropbox permits and how the
  result is handed back to the Foundry page.
- **RE-002**: Whether Foundry settings scoped to Game Masters are actually withheld from
  player clients on v14 and v13, and what storage location is appropriate for authorization
  state given that answer.
- **RE-003**: Current Dropbox behavior for proof-key authorization, short-lived tokens, and
  renewal grants, including whether renewal is available without an application secret.
- **RE-004**: Current Dropbox shareable-link formats and the exact transformation that yields
  a direct-content URL, plus how long that behavior can be relied upon.
- **RE-005**: Cross-origin behavior for Dropbox content hosts when loaded by image, audio,
  and video elements, and whether validation can be performed without triggering restrictions.
- **RE-006**: Whether The Forge's content-security policy permits Dropbox content and API
  hosts, and what the failure mode looks like if it does not.
- **RE-007**: Foundry v14 extension points for asset fields and the file picker, the v13
  differences, and whether a supported hook exists for adding an action without patching.
- **RE-008**: Dropbox listing, pagination, and thumbnail endpoints and their rate-limit
  characteristics, including how to page a 1,000-entry folder within request budgets.
- **RE-009**: Dropbox behavior when a shareable link already exists, including concurrent
  creation, and how to detect and adopt the existing link.
- **RE-010**: A safe method for validating that a URL yields usable media in the browser
  without downloading whole audio or video files.
- **RE-011**: Whether AVIF and the listed audio and video formats are usable across the
  supported browsers and Foundry versions, so that classification claims stay honest.

## Out of Scope *(mandatory)*

- Uploading files from Foundry to Dropbox.
- Editing, moving, renaming, or deleting Dropbox files.
- Synchronizing Dropbox with Forge Assets.
- Downloading or mirroring assets into Foundry or Forge storage.
- Background synchronization of any kind.
- Multiple simultaneous Dropbox accounts.
- Dropbox Business team administration.
- Content-based asset deduplication.
- Automatic media conversion, transcoding, or optimization.
- Replacing every native Foundry file picker source, or full file-picker replacement.
- Any separate hosted backend service operated by the module.
- Sharing private Dropbox files without shareable links.
- Revoking shareable links from within the module.
- Automatic replacement or rewriting of existing Foundry asset URLs.
- Game-system-specific behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Game Master completes first-time setup — from installing the module to
  seeing the authorized root folder listed — in under 5 minutes, without editing files or
  reading source code.
- **SC-002**: A Game Master assigns a Dropbox-hosted image to a scene background in under
  60 seconds and with zero manual upload or copy steps into Foundry or Forge storage.
- **SC-003**: 100% of players with no Dropbox account can view every asset a Game Master has
  assigned from Dropbox.
- **SC-004**: 100% of assigned assets still render after the Game Master's Dropbox
  authorization has expired and after the account has been disconnected, provided the file
  and its shareable link still exist.
- **SC-005**: Opening a folder containing 1,000 entries shows a usable first page within 3
  seconds and remains scrollable and filterable without the interface freezing.
- **SC-006**: Rendering a folder listing produces zero created or resolved shareable links;
  links are produced only for files the user previews or selects.
- **SC-007**: Selecting the same file any number of times yields the same URL and results in
  no more than one shareable link for that file.
- **SC-008**: 100% of the failure conditions listed in the requirements produce a
  user-visible message that names the problem and the next action; zero result in a silent
  failure or an unexplained blank state.
- **SC-009**: Zero tokens, authorization codes, proof-key values, or full shareable URLs
  appear in browser logs, Foundry logs, exported settings, or diagnostic reports.
- **SC-010**: The native Foundry file picker and Forge asset workflow remain fully usable in
  100% of tested states, including disconnected, unauthorized, rate-limited, offline, and
  module-disabled.
- **SC-011**: The module installs from its manifest URL and activates in a system-agnostic
  world on the primary target Foundry version with no startup errors.
- **SC-012**: The module makes zero network requests to hosts other than Dropbox and the
  Foundry host during normal operation.
- **SC-013**: Every acceptance scenario in this specification is demonstrable on a
  Forge-hosted world and on a self-hosted world.

## Assumptions

- One Dropbox account per Foundry world is sufficient; multi-account support is deferred.
- The Game Master registers their own Dropbox application and supplies its key; the project
  does not distribute a shared application identity, since that would concentrate rate limits
  and risk.
- Dropbox permits proof-key authorization without an application secret for the scopes
  needed; RE-003 must confirm this before implementation.
- "Only users with an appropriate Foundry permission may browse" is implemented as a
  configurable permission defaulting to Game Master only.
- The user-supplied format list is honored with one policy-driven exception: SVG is
  recognized but disabled by default and requires explicit opt-in, because remote vector
  images can carry active content.
- The Scene background field is the guaranteed integration surface for the first release.
  Additional surfaces — foreground, tiles, actor and token art, journal images, item art,
  playlist audio, and video fields — are added wherever a supported, non-invasive extension
  point exists; where none exists, the surface is deferred rather than patched in.
- Asset category is determined by filename extension, with Dropbox-supplied content type
  used as a secondary signal when available.
- The shared-link privacy warning is acknowledged once per world and remains readable in
  settings thereafter.
- Default cache lifetime for folder metadata is on the order of a few minutes and is
  configurable; resolved link mappings are cached for the world's lifetime until cleared.
- Default page size for incremental loading is a moderate value tuned for responsiveness and
  configurable through settings.
- Audio and video are never autoplayed; previews require an explicit user action.
- Standard broadband connectivity is assumed for the performance criteria.
- Mobile and tablet layouts are not a first-release target, though nothing should
  deliberately break them.
- Foundry, Forge, Dropbox, and browser behaviors listed in Research & Evidence remain
  unverified assumptions until evidenced; each is a blocker for the parts of the feature it
  governs.
