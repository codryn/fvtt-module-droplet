export const DROPLET_ERROR_CODES = [
  "NotConnected",
  "AuthorizationDenied",
  "OAuthStateMismatch",
  "AuthorizationExpired",
  "TokenRefreshFailure",
  "InsufficientScopes",
  "InvalidAppKey",
  "RootFolderMissing",
  "RootPolicyViolation",
  "FileDeleted",
  "FolderDeleted",
  "UnsupportedMediaType",
  "SharedLinkCreationFailure",
  "SharedLinkAlreadyExists",
  "RateLimited",
  "NetworkFailure",
  "CorsRestriction",
  "CspRestriction",
  "DropboxOutage",
  "UrlValidationFailure",
  "UnsupportedFoundryVersion",
  "FoundryIntegrationFailure",
  "CursorExpired",
  "Cancelled",
] as const;

export type DropletErrorCode = (typeof DROPLET_ERROR_CODES)[number];

export type RecoveryAction =
  | { kind: "none" }
  | { kind: "reconnect" }
  | { kind: "retry"; afterMs?: number }
  | { kind: "openSettings"; section?: string }
  | { kind: "chooseAnotherFile" }
  | { kind: "documentation"; anchor: string };

export interface DropletErrorShape {
  readonly code: DropletErrorCode;
  readonly i18nKey: string;
  readonly recovery: RecoveryAction;
  readonly technicalDetail: string;
  readonly retryAfterMs: number | null;
  readonly cause?: unknown;
}

export interface DropletErrorOptions {
  readonly cause?: unknown;
  readonly detail?: string;
  readonly message?: string;
  readonly recovery?: RecoveryAction;
  readonly retryAfterMs?: number | null;
}

export interface DropboxErrorContext {
  readonly status: number;
  readonly endpoint:
    | "listFolder"
    | "listFolderContinue"
    | "getMetadata"
    | "getThumbnailBatch"
    | "listSharedLinks"
    | "createSharedLink"
    | "getCurrentAccount"
    | "revokeToken"
    | "unknown";
  readonly errorTag?: string;
  readonly errorSummary?: string;
  readonly retryAfterMs?: number | null;
  readonly cause?: unknown;
}

export interface DiagnosticRecord {
  readonly code: DropletErrorCode;
  readonly message: string;
  readonly technicalDetail: string;
  readonly timestamp: number;
}
