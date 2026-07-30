import { DROPBOX_HOSTS } from "@/dropbox/endpoints";

import { REQUIRED_DROPBOX_SCOPES } from "@/constants";

export interface AuthorizeUrlOptions {
  readonly clientId: string;
  readonly codeChallenge: string;
  readonly offlineAccess?: boolean;
  readonly redirectUri?: string | null;
  readonly scopes?: readonly string[];
  readonly state?: string | null;
}

export function buildAuthorizeUrl(options: AuthorizeUrlOptions): string {
  const url = new URL("/oauth2/authorize", DROPBOX_HOSTS.authorize);
  const scopes = options.scopes ?? REQUIRED_DROPBOX_SCOPES;

  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("token_access_type", options.offlineAccess ? "offline" : "online");

  if (options.redirectUri) {
    url.searchParams.set("redirect_uri", options.redirectUri);
  }

  if (options.state) {
    url.searchParams.set("state", options.state);
  }

  return url.toString();
}