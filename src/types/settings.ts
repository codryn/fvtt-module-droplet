import {
  ACCESS_MODES,
  DISPLAY_MODES,
  SETTINGS,
} from "@/constants";

export type AccessMode = (typeof ACCESS_MODES)[number];
export type DisplayMode = (typeof DISPLAY_MODES)[number];
export type SettingScope = "world" | "client";
export type SettingConstructor =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ObjectConstructor;

export interface DropletConnectionState {
  readonly accountId: string;
  readonly accountLabel: string;
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresAt: number;
  readonly grantedScopes: readonly string[];
  readonly accessMode: AccessMode;
  readonly appKey: string;
  readonly connectedAt: number;
}

export interface SettingValueMap {
  [SETTINGS.appKey]: string;
  [SETTINGS.accessMode]: AccessMode;
  [SETTINGS.rootPath]: string;
  [SETTINGS.allowSvg]: boolean;
  [SETTINGS.offlineAccess]: boolean;
  [SETTINGS.browsePermissionRole]: number;
  [SETTINGS.folderCacheTtlSeconds]: number;
  [SETTINGS.pageSize]: number;
  [SETTINGS.thumbnailBatchSize]: number;
  [SETTINGS.thumbnailBatchesInFlight]: number;
  [SETTINGS.showSharedLinkWarning]: boolean;
  [SETTINGS.connection]: DropletConnectionState | null;
  [SETTINGS.lastBrowsedPath]: string;
  [SETTINGS.displayMode]: DisplayMode;
}

export interface SettingScopeMap {
  [SETTINGS.appKey]: "world";
  [SETTINGS.accessMode]: "world";
  [SETTINGS.rootPath]: "world";
  [SETTINGS.allowSvg]: "world";
  [SETTINGS.offlineAccess]: "world";
  [SETTINGS.browsePermissionRole]: "world";
  [SETTINGS.folderCacheTtlSeconds]: "world";
  [SETTINGS.pageSize]: "world";
  [SETTINGS.thumbnailBatchSize]: "world";
  [SETTINGS.thumbnailBatchesInFlight]: "world";
  [SETTINGS.showSharedLinkWarning]: "world";
  [SETTINGS.connection]: "client";
  [SETTINGS.lastBrowsedPath]: "client";
  [SETTINGS.displayMode]: "client";
}

export type SettingKey = keyof SettingValueMap;
export type SettingValue<K extends SettingKey> = SettingValueMap[K];

export interface SettingDefinition<K extends SettingKey> {
  readonly name: string;
  readonly hint: string;
  readonly scope: SettingScopeMap[K];
  readonly config: boolean;
  readonly type: SettingConstructor;
  readonly default: SettingValue<K>;
  readonly restricted?: boolean;
  readonly choices?: Record<string, string>;
  readonly onChange?: (value: SettingValue<K>) => void;
}
