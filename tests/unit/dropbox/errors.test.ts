import { describe, expect, it } from "vitest";

import { mapDropboxError } from "@/dropbox/errors";
import { dropboxErrorFixtures } from "../../fixtures/dropbox/errorFixtures";

describe("mapDropboxError", () => {
  it("maps 403 access_denied to AuthorizationDenied", () => {
    const error = mapDropboxError(dropboxErrorFixtures.authorizationDenied);

    expect(error.code).toBe("AuthorizationDenied");
    expect(error.recovery).toEqual({ kind: "reconnect" });
  });

  it("maps generic 403 access errors to InsufficientScopes", () => {
    const error = mapDropboxError(dropboxErrorFixtures.insufficientScopes);

    expect(error.code).toBe("InsufficientScopes");
    expect(error.recovery).toEqual({ kind: "openSettings" });
  });

  it("keeps shared-link conflict as an internal signal", () => {
    const error = mapDropboxError(dropboxErrorFixtures.sharedLinkAlreadyExists);

    expect(error.code).toBe("SharedLinkAlreadyExists");
    expect(error.i18nKey).toBe("DROPLET.errors.SharedLinkAlreadyExists.message");
  });

  it("uses distinct i18n keys for shared-link creation tags", () => {
    for (const fixture of dropboxErrorFixtures.sharedLinkCreationFailures) {
      const error = mapDropboxError(fixture);

      expect(error.code).toBe("SharedLinkCreationFailure");
      expect(error.i18nKey).toBe(`DROPLET.errors.SharedLinkCreationFailure.${fixture.errorTag}.message`);
      expect(error.recovery).toEqual({ kind: "retry" });
    }
  });

  it("preserves retry-after on rate limits", () => {
    const error = mapDropboxError(dropboxErrorFixtures.rateLimited);

    expect(error.code).toBe("RateLimited");
    expect(error.retryAfterMs).toBe(5000);
    expect(error.recovery).toEqual({ kind: "retry", afterMs: 5000 });
  });
});