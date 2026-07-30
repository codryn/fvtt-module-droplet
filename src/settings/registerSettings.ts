import {
  ACCESS_MODES,
  DEFAULT_BROWSE_PERMISSION_ROLE,
  DEFAULT_FOLDER_CACHE_TTL_SECONDS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_THUMBNAIL_BATCH_SIZE,
  DEFAULT_THUMBNAIL_BATCHES_IN_FLIGHT,
  DISPLAY_MODES,
  SETTINGS,
} from "@/constants";
import type { FoundryAdapter } from "@/foundry/FoundryAdapter";
import type {
  SettingDefinition,
  SettingKey,
  SettingValue,
} from "@/types/settings";
import { validateSettingValue } from "@/settings/validators";

type SettingDefinitionMap = { [K in SettingKey]: SettingDefinition<K> };

function defineSetting<K extends SettingKey>(definition: SettingDefinition<K>): SettingDefinition<K> {
  return definition;
}

const SETTING_DEFINITIONS: SettingDefinitionMap = {
  [SETTINGS.appKey]: defineSetting({
    name: "DROPLET.settings.appKey.name",
    hint: "DROPLET.settings.appKey.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    restricted: true,
  }),
  [SETTINGS.accessMode]: defineSetting({
    name: "DROPLET.settings.accessMode.name",
    hint: "DROPLET.settings.accessMode.hint",
    scope: "world",
    config: true,
    type: String,
    default: ACCESS_MODES[0],
    restricted: true,
    choices: {
      [ACCESS_MODES[0]]: "App Folder",
      [ACCESS_MODES[1]]: "Full Dropbox",
    },
  }),
  [SETTINGS.rootPath]: defineSetting({
    name: "DROPLET.settings.rootPath.name",
    hint: "DROPLET.settings.rootPath.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    restricted: true,
  }),
  [SETTINGS.allowSvg]: defineSetting({
    name: "DROPLET.settings.allowSvg.name",
    hint: "DROPLET.settings.allowSvg.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: true,
  }),
  [SETTINGS.offlineAccess]: defineSetting({
    name: "DROPLET.settings.offlineAccess.name",
    hint: "DROPLET.settings.offlineAccess.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    restricted: true,
  }),
  [SETTINGS.browsePermissionRole]: defineSetting({
    name: "DROPLET.settings.browsePermissionRole.name",
    hint: "DROPLET.settings.browsePermissionRole.hint",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_BROWSE_PERMISSION_ROLE,
    restricted: true,
  }),
  [SETTINGS.folderCacheTtlSeconds]: defineSetting({
    name: "DROPLET.settings.folderCacheTtlSeconds.name",
    hint: "DROPLET.settings.folderCacheTtlSeconds.hint",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_FOLDER_CACHE_TTL_SECONDS,
    restricted: true,
  }),
  [SETTINGS.pageSize]: defineSetting({
    name: "DROPLET.settings.pageSize.name",
    hint: "DROPLET.settings.pageSize.hint",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_PAGE_SIZE,
    restricted: true,
  }),
  [SETTINGS.thumbnailBatchSize]: defineSetting({
    name: "DROPLET.settings.thumbnailBatchSize.name",
    hint: "DROPLET.settings.thumbnailBatchSize.hint",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_THUMBNAIL_BATCH_SIZE,
    restricted: true,
  }),
  [SETTINGS.thumbnailBatchesInFlight]: defineSetting({
    name: "DROPLET.settings.thumbnailBatchesInFlight.name",
    hint: "DROPLET.settings.thumbnailBatchesInFlight.hint",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_THUMBNAIL_BATCHES_IN_FLIGHT,
    restricted: true,
  }),
  [SETTINGS.showSharedLinkWarning]: defineSetting({
    name: "DROPLET.settings.showSharedLinkWarning.name",
    hint: "DROPLET.settings.showSharedLinkWarning.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    restricted: true,
  }),
  [SETTINGS.connection]: defineSetting({
    name: "DROPLET.settings.connection.name",
    hint: "DROPLET.settings.connection.hint",
    scope: "client",
    config: false,
    type: Object,
    default: null,
  }),
  [SETTINGS.lastBrowsedPath]: defineSetting({
    name: "DROPLET.settings.lastBrowsedPath.name",
    hint: "DROPLET.settings.lastBrowsedPath.hint",
    scope: "client",
    config: false,
    type: String,
    default: "",
  }),
  [SETTINGS.displayMode]: defineSetting({
    name: "DROPLET.settings.displayMode.name",
    hint: "DROPLET.settings.displayMode.hint",
    scope: "client",
    config: false,
    type: String,
    default: DISPLAY_MODES[0],
    choices: {
      [DISPLAY_MODES[0]]: "List",
      [DISPLAY_MODES[1]]: "Grid",
    },
  }),
};

const SETTING_KEYS = Object.keys(SETTING_DEFINITIONS) as SettingKey[];

export function registerSettings(adapter: FoundryAdapter): void {
  for (const key of SETTING_KEYS) {
    adapter.registerSetting(key, SETTING_DEFINITIONS[key]);
  }
}

export function validateRegisteredSettings(adapter: FoundryAdapter): void {
  for (const key of SETTING_KEYS) {
    const currentValue = adapter.getSetting(key);
    const sanitizedValue = validateSettingValue(key, currentValue);

    if (JSON.stringify(currentValue) !== JSON.stringify(sanitizedValue)) {
      void adapter.setSetting(key, sanitizedValue as SettingValue<typeof key>);
    }
  }
}

export function getSettingDefinition<K extends SettingKey>(key: K): SettingDefinition<K> {
  return SETTING_DEFINITIONS[key];
}