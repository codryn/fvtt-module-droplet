import { describe, expect, it } from "vitest";

import { PKCE_CONSTRAINTS, challengeFor, createState, createVerifier } from "@/auth/Pkce";

describe("Pkce", () => {
  it("generates verifiers within the documented charset and bounds", () => {
    const verifier = createVerifier();
    const allowedCharacters = PKCE_CONSTRAINTS.allowedCharacters.replace(/[-\\\]]/gu, "\\$&");
    const allowedPattern = new RegExp(`^[${allowedCharacters}]+$`, "u");

    expect(verifier).toHaveLength(PKCE_CONSTRAINTS.defaultVerifierLength);
    expect(verifier.length).toBeGreaterThanOrEqual(PKCE_CONSTRAINTS.minLength);
    expect(verifier.length).toBeLessThanOrEqual(PKCE_CONSTRAINTS.maxLength);
    expect(allowedPattern.test(verifier)).toBe(true);
  });

  it("rejects verifier lengths outside the PKCE bounds", () => {
    expect(() => createVerifier(PKCE_CONSTRAINTS.minLength - 1)).toThrow(RangeError);
    expect(() => createVerifier(PKCE_CONSTRAINTS.maxLength + 1)).toThrow(RangeError);
  });

  it("derives the S256 code challenge for a verifier", async () => {
    await expect(challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).resolves.toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("generates an unpredictable state value per attempt", () => {
    const first = createState(PKCE_CONSTRAINTS.minLength);
    const second = createState(PKCE_CONSTRAINTS.minLength);

    expect(first).toHaveLength(PKCE_CONSTRAINTS.minLength);
    expect(second).toHaveLength(PKCE_CONSTRAINTS.minLength);
    expect(first).not.toBe(second);
  });
});