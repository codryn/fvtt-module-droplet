const DEFAULT_MAX_ATTEMPTS = 3;

function parseRetryAfterHeader(value: string | null, now: number): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number.parseInt(value, 10);

  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : Math.max(0, timestamp - now);
}

export function resolveRetryAfterMs(
  headerValue: string | null,
  bodyRetryAfterSeconds: number | null | undefined,
  now = Date.now(),
): number | null {
  const headerDelay = parseRetryAfterHeader(headerValue, now);
  const bodyDelay = typeof bodyRetryAfterSeconds === "number" && Number.isFinite(bodyRetryAfterSeconds)
    ? Math.max(0, bodyRetryAfterSeconds * 1000)
    : null;

  if (headerDelay === null) {
    return bodyDelay;
  }

  if (bodyDelay === null) {
    return headerDelay;
  }

  return Math.max(headerDelay, bodyDelay);
}

export function shouldRetryRateLimit(attempt: number, maxAttempts = DEFAULT_MAX_ATTEMPTS): boolean {
  return attempt < maxAttempts;
}

export function createRateLimitDelayMs(
  attempt: number,
  headerValue: string | null,
  bodyRetryAfterSeconds: number | null | undefined,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
): number | null {
  if (!shouldRetryRateLimit(attempt, maxAttempts)) {
    return null;
  }

  return resolveRetryAfterMs(headerValue, bodyRetryAfterSeconds) ?? 1000;
}

export function waitForDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", abortHandler);
      resolve();
    }, ms);

    const abortHandler = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", abortHandler, { once: true });
  });
}