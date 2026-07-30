import { describe, expect, it } from "vitest";

import { REQUIRED_DROPBOX_SCOPES } from "@/constants";
import { buildAuthorizeUrl } from "@/auth/authorizeUrl";

describe("authorizeUrl", () => {
  it("uses explicit scopes, S256, and no redirect_uri in code-display mode", () => {
    const url = new URL(buildAuthorizeUrl({
      clientId: "app-key",
      codeChallenge: "challenge-value",
    }));

    expect(url.origin).toBe("https://www.dropbox.com");
    expect(url.pathname).toBe("/oauth2/authorize");
    expect(url.searchParams.get("client_id")).toBe("app-key");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe(REQUIRED_DROPBOX_SCOPES.join(" "));
    expect(url.searchParams.get("redirect_uri")).toBeNull();
    expect(url.searchParams.get("client_secret")).toBeNull();
  });
});