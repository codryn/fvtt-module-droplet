import { describe, expect, it } from "vitest";

import {
  buildAuthorizationCodeTokenRequest,
  buildRefreshTokenRequest,
  TOKEN_REQUEST_CONSTRAINTS,
} from "@/auth/tokenRequest";

describe("tokenRequest", () => {
  it("sends both client_id and code_verifier with no secret on authorization-code exchange", () => {
    const request = buildAuthorizationCodeTokenRequest({
      clientId: "app-key",
      code: "auth-code",
      codeVerifier: "verifier-value",
      offlineAccess: true,
    });

    expect(request.get("grant_type")).toBe("authorization_code");
    expect(request.get("client_id")).toBe("app-key");
    expect(request.get("code_verifier")).toBe("verifier-value");
    expect(request.get("client_secret")).toBeNull();
    expect(request.get("refresh_token_expiration_seconds")).toBe(String(TOKEN_REQUEST_CONSTRAINTS.refreshTokenExpirationSeconds));
  });

  it("sends refresh grant_type with refresh_token and client_id", () => {
    const request = buildRefreshTokenRequest({
      clientId: "app-key",
      refreshToken: "refresh-token",
    });

    expect(request.get("grant_type")).toBe("refresh_token");
    expect(request.get("client_id")).toBe("app-key");
    expect(request.get("refresh_token")).toBe("refresh-token");
    expect(request.get("client_secret")).toBeNull();
  });
});