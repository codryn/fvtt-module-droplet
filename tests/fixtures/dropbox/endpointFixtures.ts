export const dropboxEndpointFixtures = {
  listFolder: {
    host: "https://api.dropboxapi.com",
    path: "/2/files/list_folder",
    request: { path: "", limit: 200 },
    response: {
      entries: [
        {
          ".tag": "folder",
          id: "id:folder1",
          name: "Maps",
          path_display: "/Maps",
          path_lower: "/maps",
        },
        {
          ".tag": "file",
          id: "id:file1",
          name: "city.png",
          path_display: "/Maps/city.png",
          path_lower: "/maps/city.png",
          rev: "rev:file1",
          size: 1048576,
          client_modified: "2026-07-01T12:00:00Z",
        },
      ],
      cursor: "cursor:list-folder",
      has_more: true,
    },
  },
  listFolderContinue: {
    host: "https://api.dropboxapi.com",
    path: "/2/files/list_folder/continue",
    request: { cursor: "cursor:list-folder" },
    response: {
      entries: [],
      cursor: "cursor:list-folder-2",
      has_more: false,
    },
    errors: {
      reset: {
        error_summary: "reset/..",
        error: { ".tag": "reset" },
      },
    },
  },
  getMetadata: {
    host: "https://api.dropboxapi.com",
    path: "/2/files/get_metadata",
    request: { path: "/Maps/city.png" },
    response: {
      ".tag": "file",
      id: "id:file1",
      name: "city.png",
      path_display: "/Maps/city.png",
      path_lower: "/maps/city.png",
      rev: "rev:file1",
      size: 1048576,
      client_modified: "2026-07-01T12:00:00Z",
    },
    errors: {
      notFound: {
        error_summary: "path/not_found/..",
        error: { path: { ".tag": "not_found" } },
      },
    },
  },
  getThumbnailBatch: {
    host: "https://content.dropboxapi.com",
    path: "/2/files/get_thumbnail_batch",
    request: {
      entries: [
        {
          path: "/Maps/city.png",
          size: "w128h128",
          format: "jpeg",
          mode: "strict",
        },
      ],
    },
    response: {
      entries: [
        {
          ".tag": "success",
          metadata: {
            ".tag": "file",
            id: "id:file1",
            name: "city.png",
            path_display: "/Maps/city.png",
            path_lower: "/maps/city.png",
            rev: "rev:file1",
            size: 1048576,
            client_modified: "2026-07-01T12:00:00Z",
          },
          thumbnail: "YmFzZTY0LXRodW1ibmFpbA==",
        },
      ],
    },
    errors: {
      tooManyFiles: {
        error_summary: "too_many_files/..",
        error: { ".tag": "too_many_files" },
      },
    },
  },
  listSharedLinks: {
    host: "https://api.dropboxapi.com",
    path: "/2/sharing/list_shared_links",
    request: { path: "/Maps/city.png", direct_only: true },
    response: {
      links: [
        {
          id: "sl:id:file1",
          url: "https://www.dropbox.com/scl/fi/example/city.png?rlkey=abc123&raw=1",
          path_lower: "/maps/city.png",
          name: "city.png",
        },
      ],
    },
  },
  createSharedLink: {
    host: "https://api.dropboxapi.com",
    path: "/2/sharing/create_shared_link_with_settings",
    request: { path: "/Maps/city.png" },
    response: {
      id: "sl:id:file1",
      url: "https://www.dropbox.com/scl/fi/example/city.png?rlkey=abc123&raw=1",
      path_lower: "/maps/city.png",
      name: "city.png",
    },
    errors: {
      sharedLinkAlreadyExists: {
        error_summary: "shared_link_already_exists/..",
        error: {
          ".tag": "shared_link_already_exists",
        },
      },
      emailNotVerified: {
        error_summary: "email_not_verified/..",
        error: { ".tag": "email_not_verified" },
      },
      settingsError: {
        error_summary: "settings_error/..",
        error: { ".tag": "settings_error" },
      },
      accessDenied: {
        error_summary: "access_denied/..",
        error: { ".tag": "access_denied" },
      },
      bannedMember: {
        error_summary: "banned_member/..",
        error: { ".tag": "banned_member" },
      },
      tooManySharedFolders: {
        error_summary: "too_many_shared_folders/..",
        error: { ".tag": "too_many_shared_folders" },
      },
    },
  },
  getCurrentAccount: {
    host: "https://api.dropboxapi.com",
    path: "/2/users/get_current_account",
    response: {
      account_id: "dbid:account1",
      email: "gm@example.com",
      name: { display_name: "GM Example" },
    },
  },
  revokeToken: {
    host: "https://api.dropboxapi.com",
    path: "/2/auth/token/revoke",
    response: {},
  },
} as const;