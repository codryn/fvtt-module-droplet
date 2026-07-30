const TOKEN_PATTERNS = [
  /\bsl\.[A-Za-z0-9_-]{20,}\b/gu,
  /\b(refresh_token|access_token|authorization_code|code_verifier)\b\s*[:=]\s*[^\s,;]+/giu,
];

const SHARED_LINK_PATTERN = /https:\/\/www\.dropbox\.com\/[^\s"']+/gu;

function redactSharedLink(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const tail = segments.length > 0 ? segments[segments.length - 1] : "asset";
    return `[REDACTED_SHARED_LINK:${tail}]`;
  } catch {
    return "[REDACTED_SHARED_LINK]";
  }
}

export function redactText(value: string): string {
  let redacted = value;

  for (const pattern of TOKEN_PATTERNS) {
    redacted = redacted.replace(pattern, (match, key) => {
      if (typeof key === "string") {
        return `${key}=[REDACTED]`;
      }

      return "[REDACTED_TOKEN]";
    });
  }

  return redacted.replace(SHARED_LINK_PATTERN, (match) => redactSharedLink(match));
}

export function redactValue(value: unknown): string {
  if (typeof value === "string") {
    return redactText(value);
  }

  if (value instanceof Error) {
    return redactText(value.stack ?? value.message);
  }

  try {
    return redactText(JSON.stringify(value));
  } catch {
    return "[UNSERIALIZABLE_VALUE]";
  }
}