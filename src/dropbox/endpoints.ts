export const DROPBOX_HOSTS = {
  authorize: "https://www.dropbox.com",
  api: "https://api.dropboxapi.com",
  content: "https://content.dropboxapi.com",
} as const;

export const DROPBOX_ENDPOINTS = {
  listFolder: { host: DROPBOX_HOSTS.api, path: "/2/files/list_folder" },
  listFolderContinue: { host: DROPBOX_HOSTS.api, path: "/2/files/list_folder/continue" },
  getMetadata: { host: DROPBOX_HOSTS.api, path: "/2/files/get_metadata" },
  getThumbnailBatch: { host: DROPBOX_HOSTS.content, path: "/2/files/get_thumbnail_batch" },
  listSharedLinks: { host: DROPBOX_HOSTS.api, path: "/2/sharing/list_shared_links" },
  createSharedLink: { host: DROPBOX_HOSTS.api, path: "/2/sharing/create_shared_link_with_settings" },
  getCurrentAccount: { host: DROPBOX_HOSTS.api, path: "/2/users/get_current_account" },
  revokeToken: { host: DROPBOX_HOSTS.api, path: "/2/auth/token/revoke" },
} as const;

export type DropboxEndpointName = keyof typeof DROPBOX_ENDPOINTS;