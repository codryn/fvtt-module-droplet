# OAuth Code-Display Flow

## RS-01 Outcome

Decision: Droplet ships the Dropbox authorization-code flow without a `redirect_uri` as the default path.

Reasoning:

- Dropbox documents that `redirect_uri` is optional for the code flow and displays the authorization code directly to the user when omitted.
- Forge-hosted and self-hosted Foundry worlds do not have a single stable origin that every GM can pre-register exactly.
- The code-display path therefore removes host-specific redirect registration as a prerequisite and behaves the same across supported hosts.

Implications:

- In code-display mode there is no `state` round trip. The binding is the in-memory PKCE verifier held by the active dialog session.
- Redirect mode remains an opt-in path for GMs who do have a stable, registered world origin.

Remaining live-validation spike:

- Complete the code-display flow end to end from a Forge-hosted world in Chromium and Firefox.
- Record popup-blocked behavior and reload-mid-flow behavior with exact browser outcomes.