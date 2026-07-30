const PKCE_ALLOWED_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~";
const PKCE_MIN_LENGTH = 43;
const PKCE_MAX_LENGTH = 128;
const DEFAULT_VERIFIER_LENGTH = 64;
const DEFAULT_STATE_LENGTH = 32;

function getCrypto(): Crypto {
  if (!globalThis.crypto) {
    throw new Error("Web Crypto API is unavailable.");
  }

  return globalThis.crypto;
}

function assertLength(length: number): void {
  if (!Number.isInteger(length) || length < PKCE_MIN_LENGTH || length > PKCE_MAX_LENGTH) {
    throw new RangeError(`PKCE values must be between ${PKCE_MIN_LENGTH} and ${PKCE_MAX_LENGTH} characters.`);
  }
}

function randomString(length: number): string {
  assertLength(length);

  const randomBytes = new Uint8Array(length);
  getCrypto().getRandomValues(randomBytes);

  return Array.from(randomBytes, (value) => PKCE_ALLOWED_CHARACTERS[value % PKCE_ALLOWED_CHARACTERS.length]).join("");
}

function encodeBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (value) => String.fromCharCode(value)).join("");
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

export function createVerifier(length = DEFAULT_VERIFIER_LENGTH): string {
  return randomString(length);
}

export async function challengeFor(verifier: string): Promise<string> {
  assertLength(verifier.length);

  const digest = await getCrypto().subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
}

export function createState(length = DEFAULT_STATE_LENGTH): string {
  return randomString(length);
}

export const PKCE_CONSTRAINTS = {
  allowedCharacters: PKCE_ALLOWED_CHARACTERS,
  minLength: PKCE_MIN_LENGTH,
  maxLength: PKCE_MAX_LENGTH,
  defaultVerifierLength: DEFAULT_VERIFIER_LENGTH,
  defaultStateLength: DEFAULT_STATE_LENGTH,
} as const;