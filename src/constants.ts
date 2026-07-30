export const MODULE_ID = "droplet";
export const MODULE_TITLE = "Droplet";
export const CSS_PREFIX = "droplet";

export const HOOKS = {
  ready: "droplet.ready",
  connectionChanged: "droplet.connectionChanged",
  assetSelected: "droplet.assetSelected",
} as const;

export const SETTINGS = {
  appKey: "appKey",
  accessMode: "accessMode",
  rootPath: "rootPath",
  allowSvg: "allowSvg",
  offlineAccess: "offlineAccess",
  browsePermissionRole: "browsePermissionRole",
  folderCacheTtlSeconds: "folderCacheTtlSeconds",
  pageSize: "pageSize",
  thumbnailBatchSize: "thumbnailBatchSize",
  thumbnailBatchesInFlight: "thumbnailBatchesInFlight",
  showSharedLinkWarning: "showSharedLinkWarning",
  connection: "connection",
  lastBrowsedPath: "lastBrowsedPath",
  displayMode: "displayMode",
} as const;

export const ACCESS_MODES = ["appFolder", "fullDropbox"] as const;
export const DISPLAY_MODES = ["list", "grid"] as const;
export const REQUIRED_DROPBOX_SCOPES = [
  "account_info.read",
  "files.metadata.read",
  "files.content.read",
  "sharing.read",
  "sharing.write",
] as const;
export const SUPPORTED_FOUNDRY_GENERATIONS = [13, 14] as const;
export const DEFAULT_BROWSE_PERMISSION_ROLE = 4;
export const DEFAULT_PAGE_SIZE = 200;
export const DEFAULT_FOLDER_CACHE_TTL_SECONDS = 300;
export const DEFAULT_THUMBNAIL_BATCH_SIZE = 25;
export const DEFAULT_THUMBNAIL_BATCHES_IN_FLIGHT = 2;
