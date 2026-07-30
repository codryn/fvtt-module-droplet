import { redactValue } from "@/diagnostics/Redactor";
import type {
  DropboxErrorContext,
  DropletErrorCode,
  DropletErrorOptions,
  DropletErrorShape,
  RecoveryAction,
} from "@/types/errors";

const DEFAULT_RECOVERY: Record<DropletErrorCode, RecoveryAction> = {
  NotConnected: { kind: "reconnect" },
  AuthorizationDenied: { kind: "reconnect" },
  OAuthStateMismatch: { kind: "reconnect" },
  AuthorizationExpired: { kind: "reconnect" },
  TokenRefreshFailure: { kind: "reconnect" },
  InsufficientScopes: { kind: "openSettings" },
  InvalidAppKey: { kind: "openSettings" },
  RootFolderMissing: { kind: "openSettings" },
  RootPolicyViolation: { kind: "none" },
  FileDeleted: { kind: "chooseAnotherFile" },
  FolderDeleted: { kind: "none" },
  UnsupportedMediaType: { kind: "chooseAnotherFile" },
  SharedLinkCreationFailure: { kind: "retry" },
  SharedLinkAlreadyExists: { kind: "none" },
  RateLimited: { kind: "retry" },
  NetworkFailure: { kind: "retry" },
  CorsRestriction: { kind: "documentation", anchor: "host-policy" },
  CspRestriction: { kind: "documentation", anchor: "compatibility" },
  DropboxOutage: { kind: "retry" },
  UrlValidationFailure: { kind: "chooseAnotherFile" },
  UnsupportedFoundryVersion: { kind: "documentation", anchor: "compatibility" },
  FoundryIntegrationFailure: { kind: "none" },
  CursorExpired: { kind: "none" },
  Cancelled: { kind: "none" },
};

export class DropletError extends Error implements DropletErrorShape {
  public readonly i18nKey: string;
  public readonly recovery: RecoveryAction;
  public readonly technicalDetail: string;
  public readonly retryAfterMs: number | null;
  public override readonly cause?: unknown;

  public constructor(
    public readonly code: DropletErrorCode,
    options: DropletErrorOptions = {},
  ) {
    const i18nKey = options.i18nKey ?? `DROPLET.errors.${code}.message`;

    super(options.message ?? i18nKey);
    this.name = "DropletError";
    this.i18nKey = i18nKey;
    this.recovery = options.recovery ?? DEFAULT_RECOVERY[code];
    this.technicalDetail = redactValue(options.detail ?? options.cause ?? this.message);
    this.retryAfterMs = options.retryAfterMs ?? null;
    this.cause = options.cause;
  }
}

const SHARED_LINK_CREATION_TAGS = new Set([
  "email_not_verified",
  "settings_error",
  "access_denied",
  "banned_member",
  "too_many_shared_folders",
]);

export function createDropletError(code: DropletErrorCode, options: DropletErrorOptions = {}): DropletError {
  return new DropletError(code, options);
}

export function mapDropboxError(context: DropboxErrorContext): DropletError {
  const { status, errorTag, errorSummary, retryAfterMs, cause } = context;
  const detail = `${context.endpoint} failed with status ${status}${errorTag ? ` (${errorTag})` : ""}${errorSummary ? `: ${errorSummary}` : ""}`;

  if (status === 401 && errorTag === "expired_access_token") {
    return createDropletError("AuthorizationExpired", { detail, cause });
  }

  if (status === 401 && (errorTag === "invalid_access_token" || errorTag === "user_suspended" || errorTag === "route_access_denied")) {
    return createDropletError("TokenRefreshFailure", { detail, cause });
  }

  if (status === 403 && errorTag === "invalid_client") {
    return createDropletError("InvalidAppKey", { detail, cause });
  }

  if (status === 403 && errorTag === "access_denied") {
    return createDropletError("AuthorizationDenied", { detail, cause });
  }

  if (status === 403) {
    return createDropletError("InsufficientScopes", { detail, cause });
  }

  if (status === 409 && errorTag === "reset") {
    return createDropletError("CursorExpired", { detail, cause });
  }

  if (status === 409 && errorTag === "shared_link_already_exists") {
    return createDropletError("SharedLinkAlreadyExists", { detail, cause });
  }

  if (status === 409 && errorTag === "path/not_found") {
    return createDropletError(
      context.endpoint === "listFolder" || context.endpoint === "listFolderContinue" ? "FolderDeleted" : "FileDeleted",
      { detail, cause },
    );
  }

  if (
    status === 409 &&
    SHARED_LINK_CREATION_TAGS.has(errorTag ?? "")
  ) {
    return createDropletError("SharedLinkCreationFailure", {
      detail,
      cause,
      i18nKey: `DROPLET.errors.SharedLinkCreationFailure.${errorTag}.message`,
    });
  }

  if (status === 429) {
    const recovery = typeof retryAfterMs === "number"
      ? { kind: "retry" as const, afterMs: retryAfterMs }
      : { kind: "retry" as const };

    return createDropletError("RateLimited", {
      detail,
      cause,
      recovery,
      ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
    });
  }

  if (status >= 500) {
    return createDropletError("DropboxOutage", { detail, cause });
  }

  return createDropletError("NetworkFailure", { detail, cause });
}