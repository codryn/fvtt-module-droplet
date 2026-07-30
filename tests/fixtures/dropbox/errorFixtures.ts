import type { DropboxErrorContext } from "@/types/errors";

export const dropboxErrorFixtures = {
  authorizationDenied: {
    status: 403,
    endpoint: "unknown",
    errorTag: "access_denied",
    errorSummary: "access_denied/..",
  },
  insufficientScopes: {
    status: 403,
    endpoint: "unknown",
    errorTag: "insufficient_scope",
    errorSummary: "insufficient_scope/..",
  },
  sharedLinkAlreadyExists: {
    status: 409,
    endpoint: "createSharedLink",
    errorTag: "shared_link_already_exists",
    errorSummary: "shared_link_already_exists/..",
  },
  sharedLinkCreationFailures: [
    {
      status: 409,
      endpoint: "createSharedLink",
      errorTag: "email_not_verified",
      errorSummary: "email_not_verified/..",
    },
    {
      status: 409,
      endpoint: "createSharedLink",
      errorTag: "settings_error",
      errorSummary: "settings_error/..",
    },
    {
      status: 409,
      endpoint: "createSharedLink",
      errorTag: "access_denied",
      errorSummary: "access_denied/..",
    },
    {
      status: 409,
      endpoint: "createSharedLink",
      errorTag: "banned_member",
      errorSummary: "banned_member/..",
    },
    {
      status: 409,
      endpoint: "createSharedLink",
      errorTag: "too_many_shared_folders",
      errorSummary: "too_many_shared_folders/..",
    },
  ],
  rateLimited: {
    status: 429,
    endpoint: "listFolder",
    errorTag: "too_many_requests",
    errorSummary: "too_many_requests/..",
    retryAfterMs: 5000,
  },
} satisfies Record<string, DropboxErrorContext | readonly DropboxErrorContext[]>;