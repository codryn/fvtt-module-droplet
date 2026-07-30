const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export interface AuthorizationCodeTokenRequestOptions {
  readonly clientId: string;
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri?: string | null;
  readonly offlineAccess?: boolean;
}

export interface RefreshTokenRequestOptions {
  readonly clientId: string;
  readonly refreshToken: string;
}

export function buildAuthorizationCodeTokenRequest(options: AuthorizationCodeTokenRequestOptions): URLSearchParams {
  const params = new URLSearchParams({
    client_id: options.clientId,
    code: options.code,
    code_verifier: options.codeVerifier,
    grant_type: "authorization_code",
  });

  if (options.redirectUri) {
    params.set("redirect_uri", options.redirectUri);
  }

  if (options.offlineAccess) {
    params.set("refresh_token_expiration_seconds", String(THIRTY_DAYS_IN_SECONDS));
  }

  return params;
}

export function buildRefreshTokenRequest(options: RefreshTokenRequestOptions): URLSearchParams {
  return new URLSearchParams({
    client_id: options.clientId,
    grant_type: "refresh_token",
    refresh_token: options.refreshToken,
  });
}

export const TOKEN_REQUEST_CONSTRAINTS = {
  refreshTokenExpirationSeconds: THIRTY_DAYS_IN_SECONDS,
} as const;