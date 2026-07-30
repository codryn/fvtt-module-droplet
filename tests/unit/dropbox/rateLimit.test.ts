import { describe, expect, it } from "vitest";
import {
  createRateLimitDelayMs,
  resolveRetryAfterMs,
  shouldRetryRateLimit,
} from "@/dropbox/rateLimit";

describe("rateLimit", () => {
  it("prefers the larger retry-after value", () => {
    expect(resolveRetryAfterMs("3", 5, 0)).toBe(5000);
  });

  it("stops retrying at the attempt bound", () => {
    expect(shouldRetryRateLimit(1, 3)).toBe(true);
    expect(shouldRetryRateLimit(3, 3)).toBe(false);
    expect(createRateLimitDelayMs(3, "1", null, 3)).toBeNull();
  });
});