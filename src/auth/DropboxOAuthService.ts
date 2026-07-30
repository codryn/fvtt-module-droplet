import { HOOKS, REQUIRED_DROPBOX_SCOPES, SETTINGS } from "@/constants";
import { buildAuthorizeUrl } from "@/auth/authorizeUrl";
import { CredentialStore } from "@/auth/CredentialStore";
import { challengeFor, createState, createVerifier } from "@/auth/Pkce";
import { buildAuthorizationCodeTokenRequest, buildRefreshTokenRequest } from "@/auth/tokenRequest";
import { createDropletError, DropletError } from "@/dropbox/errors";
import type { FoundryAdapter } from "@/foundry/FoundryAdapter";
import type { AccessMode, DropletConnectionState } from "@/types/settings";

const PKCE_SESSION_TTL_MS = 10 * 60 * 1000;

interface OAuthTokenResponse {
  readonly accessToken: string;
  readonly accountId: string;
  readonly expiresIn: number;
  readonly refreshToken: string | null;
  readonly scope: string;
}

interface OAuthAccountSummary {
  readonly accountId: string;
  readonly displayName: string;
  readonly email: string;
}

export interface PendingPkceSession {
  readonly challenge: string;
  readonly createdAt: number;
  readonly redirectUri: string | null;
  readonly state: string | null;
  readonly verifier: string;
}

export interface OAuthStatus {
  readonly accessMode: AccessMode;
  readonly accountLabel: string;
  readonly connected: boolean;
  readonly expiresAt: number | null;
  readonly hasRefreshToken: boolean;
}

export interface DropboxOAuthTransport {
  exchangeAuthorizationCode(request: URLSearchParams, signal?: AbortSignal): Promise<OAuthTokenResponse>;
  getCurrentAccount(accessToken: string, signal?: AbortSignal): Promise<OAuthAccountSummary>;
  refreshAccessToken(request: URLSearchParams, signal?: AbortSignal): Promise<OAuthTokenResponse>;
  revokeToken(accessToken: string, signal?: AbortSignal): Promise<void>;
}

export interface CompleteConnectOptions {
  readonly code: string;
  readonly signal?: AbortSignal;
  readonly state?: string | null;
}

export interface ConnectResult {
  readonly authorizeUrl: string;
  readonly session: PendingPkceSession;
}

function splitScopes(scope: string): readonly string[] {
  return scope.split(/\s+/u).map((value) => value.trim()).filter((value) => value.length > 0);
}

export class DropboxOAuthService {
  private readonly credentialStore: CredentialStore;
  private pendingSession: PendingPkceSession | null = null;
  private refreshInFlight: Promise<DropletConnectionState> | null = null;

  public constructor(
    private readonly adapter: FoundryAdapter,
    private readonly transport: DropboxOAuthTransport,
    credentialStore?: CredentialStore,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.credentialStore = credentialStore ?? new CredentialStore(adapter, now);
  }

  public async connect(options: { readonly redirectUri?: string | null } = {}): Promise<ConnectResult> {
    const clientId = this.getRequiredAppKey();
    const verifier = createVerifier();
    const challenge = await challengeFor(verifier);
    const redirectUri = options.redirectUri ?? null;
    const state = redirectUri ? createState() : null;
    const session: PendingPkceSession = {
      challenge,
      createdAt: this.now(),
      redirectUri,
      state,
      verifier,
    };

    this.pendingSession = session;

    return {
      authorizeUrl: buildAuthorizeUrl({
        clientId,
        codeChallenge: challenge,
        offlineAccess: this.adapter.getSetting(SETTINGS.offlineAccess),
        redirectUri,
        scopes: REQUIRED_DROPBOX_SCOPES,
        state,
      }),
      session,
    };
  }

  public async completeConnect(options: CompleteConnectOptions): Promise<DropletConnectionState> {
    const session = this.getValidPendingSession(options.state);
    const clientId = this.getRequiredAppKey();
    const accessMode = this.adapter.getSetting(SETTINGS.accessMode);
    const offlineAccess = this.adapter.getSetting(SETTINGS.offlineAccess);
    const token = await this.transport.exchangeAuthorizationCode(
      buildAuthorizationCodeTokenRequest({
        clientId,
        code: options.code,
        codeVerifier: session.verifier,
        offlineAccess,
        redirectUri: session.redirectUri,
      }),
      options.signal,
    );
    const account = await this.transport.getCurrentAccount(token.accessToken, options.signal);
    const persistedState = await this.credentialStore.write({
      accountId: token.accountId || account.accountId,
      accountLabel: account.displayName || account.email,
      accessMode,
      accessToken: token.accessToken,
      appKey: clientId,
      connectedAt: this.now(),
      expiresAt: this.now() + (token.expiresIn * 1000) - 60_000,
      grantedScopes: splitScopes(token.scope),
      refreshToken: offlineAccess ? token.refreshToken : null,
    });

    this.pendingSession = null;
    Hooks.callAll(HOOKS.connectionChanged, { connected: true });
    return persistedState;
  }

  public async disconnect(signal?: AbortSignal): Promise<void> {
    const currentState = await this.credentialStore.read();

    this.pendingSession = null;
    await this.credentialStore.clear();
    Hooks.callAll(HOOKS.connectionChanged, { connected: false });

    if (currentState) {
      try {
        await this.transport.revokeToken(currentState.accessToken, signal);
      } catch {
        return;
      }
    }
  }

  public async getAccessToken(signal?: AbortSignal): Promise<string> {
    const currentState = await this.credentialStore.read();

    if (!currentState) {
      throw createDropletError("NotConnected");
    }

    if (currentState.expiresAt > this.now()) {
      return currentState.accessToken;
    }

    if (!currentState.refreshToken) {
      throw createDropletError("AuthorizationExpired", {
        detail: "Access token expired and no refresh token is available.",
      });
    }

    const refreshedState = await this.refreshAccessToken(currentState, signal);
    return refreshedState.accessToken;
  }

  public async status(): Promise<OAuthStatus> {
    const connection = await this.credentialStore.read();
    const accessMode = this.adapter.getSetting(SETTINGS.accessMode);

    return {
      accessMode,
      accountLabel: connection?.accountLabel ?? "",
      connected: connection !== null,
      expiresAt: connection?.expiresAt ?? null,
      hasRefreshToken: connection?.refreshToken !== null,
    };
  }

  private async refreshAccessToken(
    currentState: DropletConnectionState,
    signal?: AbortSignal,
  ): Promise<DropletConnectionState> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.performRefresh(currentState, signal).finally(() => {
        this.refreshInFlight = null;
      });
    }

    return this.refreshInFlight;
  }

  private async performRefresh(
    currentState: DropletConnectionState,
    signal?: AbortSignal,
  ): Promise<DropletConnectionState> {
    try {
      const token = await this.transport.refreshAccessToken(
        buildRefreshTokenRequest({
          clientId: currentState.appKey,
          refreshToken: currentState.refreshToken ?? "",
        }),
        signal,
      );

      const nextState = await this.credentialStore.write({
        ...currentState,
        accessToken: token.accessToken,
        expiresAt: this.now() + (token.expiresIn * 1000) - 60_000,
        grantedScopes: splitScopes(token.scope),
        refreshToken: currentState.refreshToken,
      });

      Hooks.callAll(HOOKS.connectionChanged, { connected: true, refreshed: true });
      return nextState;
    } catch (error) {
      await this.credentialStore.clear();

      if (error instanceof DropletError && error.code === "Cancelled") {
        throw error;
      }

      throw createDropletError("TokenRefreshFailure", {
        cause: error,
        detail: "Refreshing the Dropbox access token failed.",
      });
    }
  }

  private getRequiredAppKey(): string {
    const clientId = this.adapter.getSetting(SETTINGS.appKey).trim();

    if (!clientId) {
      throw createDropletError("InvalidAppKey", {
        detail: "A Dropbox app key is required before starting OAuth.",
      });
    }

    return clientId;
  }

  private getValidPendingSession(state?: string | null): PendingPkceSession {
    if (!this.pendingSession) {
      throw createDropletError("OAuthStateMismatch", {
        detail: "No PKCE authorization session is pending.",
      });
    }

    if ((this.now() - this.pendingSession.createdAt) > PKCE_SESSION_TTL_MS) {
      this.pendingSession = null;
      throw createDropletError("OAuthStateMismatch", {
        detail: "The pending PKCE authorization session expired.",
      });
    }

    if (this.pendingSession.state !== null && this.pendingSession.state !== (state ?? null)) {
      throw createDropletError("OAuthStateMismatch", {
        detail: "The returned OAuth state did not match the pending PKCE authorization session.",
      });
    }

    return this.pendingSession;
  }
}