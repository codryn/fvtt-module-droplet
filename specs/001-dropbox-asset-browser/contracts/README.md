# Interface Contracts

**Feature**: 001-dropbox-asset-browser | **Plan**: [../plan.md](../plan.md)

Droplet is a Foundry VTT module, so its external interfaces are: the Foundry manifest it
publishes, the settings keys it registers, the localization keys it owns, the small JavaScript API
it exposes to other modules and macros, and the internal seams that its own layers depend on.
Those seams are contracts because they are the boundaries the constitution requires to stay
stable and independently testable.

| Contract | File | Audience |
|---|---|---|
| Dropbox transport | [dropbox-client.md](dropbox-client.md) | Internal; the only place `fetch` is called |
| Foundry surface | [foundry-adapter.md](foundry-adapter.md) | Internal; the only place Foundry globals are touched |
| Public module API, manifest, settings, localization | [module-api.md](module-api.md) | External |
| Typed errors | [error-model.md](error-model.md) | Internal and user-facing |

**Rules that apply to every contract**

1. A contract change that removes or renames a member is a breaking change and requires a major
   version bump and a release note.
2. No contract may expose a raw Dropbox response type; results are project-owned types.
3. No contract may accept or return a Foundry global.
4. Every asynchronous method accepts an optional `AbortSignal` and rejects with `Cancelled` when
   aborted.
5. Every method that can fail rejects with a `DropletError`, never with a raw `Error`, a string,
   or a Dropbox payload.
