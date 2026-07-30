# Quickstart: validating the Dropbox asset browser

**Feature**: 001-dropbox-asset-browser | **Plan**: [plan.md](plan.md) |
**Contracts**: [contracts/README.md](contracts/README.md)

This is a validation guide, not an implementation guide. It describes how to prove the feature
works end to end and how to check the invariants that the plan treats as non-negotiable.
Implementation detail belongs in [tasks.md](tasks.md).

## Prerequisites

| Requirement | Notes |
|---|---|
| Node | `>=20.19` (see `package.json` `engines`) |
| Foundry VTT | A version inside the compatibility matrix in [plan.md](plan.md) |
| A Dropbox app | Created by the tester at the Dropbox App Console |
| A test folder | A few images, one file over 20 MB, one unsupported type, and one file with a non-ASCII name |

**Dropbox app setup**

1. Create an app with **Scoped access**.
2. Choose **App folder** access for the default path; a second app with Full Dropbox is only
   needed to exercise the opt-in mode.
3. On the Permissions tab enable exactly: `account_info.read`, `files.metadata.read`,
   `files.content.read`, `sharing.read`, `sharing.write`. Nothing else — the browser will assert
   the requested scope list matches.
4. Copy the **App key**. There is no secret to copy; PKCE does not use one.
5. Leave the redirect URI list empty for the default code-display flow. Add an exact HTTPS origin
   only if you intend to test redirect mode.

## Install and build

```powershell
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all four commands exit 0, and `npm run build` produces the module bundle with no
runtime dependencies in the output.

To load the built module, link or copy the build output into your Foundry `Data/modules/droplet`
directory and restart Foundry.

## Scenario 1 — Connect

1. Enable the module in a world, open **Game Settings → Droplet**.
2. Paste the App key, leave access mode at **App folder**, save.
3. Click **Connect Dropbox**. A new tab opens on `dropbox.com`.
4. Approve. Dropbox displays an authorization code on the page rather than redirecting.
5. Paste the code into the settings dialog.

**Expect**: status becomes connected and shows the account label. **Verify**:

- The authorize URL contains `code_challenge_method=S256` and an explicit `scope` listing exactly
  the five scopes above, and contains no `client_secret`.
- No `redirect_uri` is present in the default flow.
- Reload the page. The connection persists for this browser only.
- Open a second browser as a different user. That user has no connection, because credentials are
  client-scoped.

**Failure to watch for**: if the token exchange fails, confirm the request body sent both
`client_id` **and** `code_verifier`. Sending only one is the single most likely PKCE mistake, and
the Dropbox prose guide is misleading on this point (see [research.md](research.md) RE-003).

## Scenario 2 — Browse

1. Open a Scene's configuration sheet.
2. Confirm the native file-picker control is unchanged and a **Browse Dropbox** button sits next
   to it.
3. Click it.

**Expect**: the first page of the App folder renders. **Verify**:

- Only one `list_folder` request is issued per page.
- Scrolling to the end issues `list_folder/continue`, not a fresh `list_folder`.
- Name filtering and category filtering issue **zero** network requests.
- Navigating away mid-load aborts the in-flight request rather than rendering stale entries.
- A folder returning slightly more entries than `pageSize` still renders correctly; Dropbox
  documents `limit` as approximate.

## Scenario 3 — Thumbnails

**Expect**: images show thumbnails; other files show type icons. **Verify**:

- Thumbnail requests go to `content.dropboxapi.com`, not `api.dropboxapi.com`.
- No request contains more than 25 entries.
- The file over 20 MB is never included in a batch, because Dropbox will not thumbnail it.
- The unsupported type is never included in a batch.
- Closing the browser revokes every object URL; nothing binary is written to `localStorage`.

## Scenario 4 — Select an asset

1. Select an image and confirm.

**Expect**: the scene's background field is populated with an `https://www.dropbox.com/...raw=1`
URL. **Verify**:

- The URL has no `dl` parameter and retains its `rlkey`.
- The scene sheet becomes dirty but is **not** saved by Droplet; you save it yourself.
- Selecting the same file again performs no network request — the shared-link cache is keyed by
  file id plus rev.
- Selecting a file that already had a shared link in Dropbox performs **one** request, not two,
  because `settings` is omitted so the existing link's metadata comes back on the conflict
  (see [contracts/dropbox-client.md](contracts/dropbox-client.md) and ADR-011).

## Scenario 5 — Player playback

1. Save the scene, then join the world as a player in a separate browser profile.

**Expect**: the background renders for the player, who has no Dropbox account and never
authenticates. This is the whole point of using shared links rather than temporary links.

## Scenario 6 — Failure handling

| Induce | Expect |
|---|---|
| Delete the file in Dropbox, then reselect it from a cached page | `FileDeleted` with a "choose another file" recovery, not a stack trace |
| Change the root to a folder that does not exist | `RootFolderMissing`, surfaced at browse time and not at startup |
| Type `../` variants into any path input | `RootPolicyViolation`; disabled controls are never the enforcement mechanism |
| Revoke the app's access from the Dropbox account settings | The next request goes to re-authorization directly, without an endless refresh loop |
| Throttle the network to trigger 429 | A visible throttle state and a retry honouring `Retry-After`, capped at three attempts |
| Leave a page cursor idle until it is invalidated | The folder silently restarts from page one; no user-facing error |

## Security checks

These are pass/fail gates, not observations.

1. Export the world's settings. Assert **no** token-shaped value appears in any world-scoped
   setting. Authentication state is client-scoped only.
2. Open the browser devtools network tab. Assert **no** request URL contains the access token —
   it travels only in the `Authorization` header (ADR-010).
3. Generate a diagnostic report. Assert it contains no full shared-link URL, no token, and no
   authorization code.
4. Create a file whose name contains `<img src=x onerror=alert(1)>`. Assert it renders as literal
   text and executes nothing.
5. With `allowSvg` off, assert SVG files are excluded from results.

## Automated equivalents

| Layer | Command | Covers |
|---|---|---|
| Unit and integration | `npm run test` | Path policy, classification, URL normalization, error mapping, retry scheduling, cache bounds |
| Coverage | `npm run test:coverage` | Enforces the thresholds in the plan's test strategy |
| Browser | `npm run test:browser` | Scene-sheet injection, selection round trip, abort on navigation |

Fixtures for every Dropbox response are authored from
[contracts/dropbox-client.md](contracts/dropbox-client.md). If a fixture and the live API
disagree, the contract file is corrected first and the fixture regenerated from it.

## Known open item

RS-06 — whether Forge VTT's Content-Security-Policy permits loading Dropbox-hosted media — is
**unresolved**, because no authoritative Forge documentation could be reached during planning. Do
not record a pass for Forge hosting until it is tested on an actual Forge instance. Thumbnails are
delivered as base64 and rendered as `data:` URIs, so a restrictive `img-src` would affect the
final saved asset URL rather than the browser's previews.
