import {
  ACCESS_MODES,
  DEFAULT_BROWSE_PERMISSION_ROLE,
  DEFAULT_FOLDER_CACHE_TTL_SECONDS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_THUMBNAIL_BATCH_SIZE,
  DEFAULT_THUMBNAIL_BATCHES_IN_FLIGHT,
  DISPLAY_MODES,
  REQUIRED_DROPBOX_SCOPES,
  SETTINGS,
} from "@/constants";
import { createDropletError } from "@/dropbox/errors";
import type {
  AccessMode,
  DisplayMode,
  DropletConnectionState,
  SettingKey,
  SettingValue,
} from "@/types/settings";

function clampNumber(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function validateEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function validateConnectionState(value: unknown): DropletConnectionState | null {
  if (value === null) {
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DropletConnectionState>;
  const grantedScopes = Array.isArray(candidate.grantedScopes)
    ? candidate.grantedScopes.filter((scope): scope is string => typeof scope === "string")
    : [];

  const missingScopes = REQUIRED_DROPBOX_SCOPES.filter((scope) => !grantedScopes.includes(scope));

  if (missingScopes.length > 0) {
    throw createDropletError("InsufficientScopes", {
      detail: `Missing required Dropbox scopes: ${missingScopes.join(", ")}`,
    });
  }

  if (
    typeof candidate.accountId !== "string" ||
    candidate.accountId.length === 0 ||
    typeof candidate.accountLabel !== "string" ||
    candidate.accountLabel.length === 0 ||
    typeof candidate.accessToken !== "string" ||
    candidate.accessToken.length === 0 ||
    typeof candidate.expiresAt !== "number" ||
    !Number.isFinite(candidate.expiresAt) ||
    typeof candidate.connectedAt !== "number" ||
    typeof candidate.appKey !== "string" ||
    candidate.appKey.length === 0
  ) {
    return null;
  }

  return {
    accountId: candidate.accountId,
    accountLabel: candidate.accountLabel,
    accessToken: candidate.accessToken,
    refreshToken: typeof candidate.refreshToken === "string" ? candidate.refreshToken : null,
    expiresAt: candidate.expiresAt,
    grantedScopes,
    accessMode: validateEnum(candidate.accessMode, ACCESS_MODES, ACCESS_MODES[0]),
    appKey: candidate.appKey,
    connectedAt: candidate.connectedAt,
  };
}

export function validateSettingValue<K extends SettingKey>(key: K, value: unknown): SettingValue<K> {
  switch (key) {
    case SETTINGS.appKey:
      return (typeof value === "string" ? value.trim() : "") as SettingValue<K>;
    case SETTINGS.accessMode:
      return validateEnum(value, ACCESS_MODES, ACCESS_MODES[0]) as SettingValue<K>;
    case SETTINGS.rootPath:
      return (typeof value === "string" ? value.trim() : "") as SettingValue<K>;
    case SETTINGS.allowSvg:
    case SETTINGS.offlineAccess:
    case SETTINGS.showSharedLinkWarning:
      return Boolean(value) as SettingValue<K>;
    case SETTINGS.browsePermissionRole:
      return clampNumber(value, 1, 5, DEFAULT_BROWSE_PERMISSION_ROLE) as SettingValue<K>;
    case SETTINGS.folderCacheTtlSeconds:
      return clampNumber(value, 0, 3600, DEFAULT_FOLDER_CACHE_TTL_SECONDS) as SettingValue<K>;
    case SETTINGS.pageSize:
      return clampNumber(value, 25, 500, DEFAULT_PAGE_SIZE) as SettingValue<K>;
    case SETTINGS.thumbnailBatchSize:
      return clampNumber(value, 1, 25, DEFAULT_THUMBNAIL_BATCH_SIZE) as SettingValue<K>;
    case SETTINGS.thumbnailBatchesInFlight:
      return clampNumber(value, 1, 4, DEFAULT_THUMBNAIL_BATCHES_IN_FLIGHT) as SettingValue<K>;
    case SETTINGS.connection:
      return validateConnectionState(value) as SettingValue<K>;
    case SETTINGS.lastBrowsedPath:
      return (typeof value === "string" ? value.trim() : "") as SettingValue<K>;
    case SETTINGS.displayMode:
      return validateEnum(value, DISPLAY_MODES, DISPLAY_MODES[0]) as SettingValue<K>;
    default:
      throw new Error(`Unknown Droplet setting key: ${String(key)}`);
  }
}

export function validateAccessMode(value: unknown): AccessMode {
  return validateSettingValue(SETTINGS.accessMode, value);
}

export function validateDisplayMode(value: unknown): DisplayMode {
  return validateSettingValue(SETTINGS.displayMode, value);
}