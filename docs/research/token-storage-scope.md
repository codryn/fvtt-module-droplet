# Token Storage Scope

## RS-02 Outcome

Decision: All Dropbox authorization state is stored only in the client-scoped `droplet.connection` setting. No token-derived value is stored in a world-scoped setting or document.

Reasoning:

- World-scoped settings are world data and the design cannot assume a GM-only form keeps the underlying value private.
- Client scope keeps the connection local to one browser profile and aligns with the module's privacy constraints.
- `sessionStorage` was rejected because it would force a reconnect on every reload.

Implementation result:

- `CredentialStore` persists only `SETTINGS.connection`.
- The registered connection setting remains client-scoped.
- The current unit coverage asserts that authentication state does not belong to a world-scoped setting.

Remaining live-validation spike:

- On Foundry v13 and v14, create sentinel client- and world-scoped settings and inspect a non-GM player client in a separate browser profile.
- Record whether each sentinel appears in the player's settings collection or `localStorage`.