import { describe, expect, it } from "vitest";

import { DROPBOX_ENDPOINTS } from "@/dropbox/endpoints";
import { dropboxEndpointFixtures } from "../../fixtures/dropbox/endpointFixtures";

describe("dropbox endpoint fixtures", () => {
  it("pin the host and path matrix used by the transport", () => {
    for (const [endpointName, fixture] of Object.entries(dropboxEndpointFixtures)) {
      const endpoint = DROPBOX_ENDPOINTS[endpointName as keyof typeof DROPBOX_ENDPOINTS];

      expect(endpoint.host).toBe(fixture.host);
      expect(endpoint.path).toBe(fixture.path);
    }
  });

  it("pins the thumbnail batch request to the content host", () => {
    expect(dropboxEndpointFixtures.getThumbnailBatch.host).toBe("https://content.dropboxapi.com");
    expect(dropboxEndpointFixtures.getThumbnailBatch.request.entries).toHaveLength(1);
  });

  it("pins the create shared-link error union tags", () => {
    expect(Object.keys(dropboxEndpointFixtures.createSharedLink.errors)).toEqual([
      "sharedLinkAlreadyExists",
      "emailNotVerified",
      "settingsError",
      "accessDenied",
      "bannedMember",
      "tooManySharedFolders",
    ]);
  });
});