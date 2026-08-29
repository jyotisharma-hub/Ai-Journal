/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively removes any undefined fields or properties from an object before
 * sending to backend APIs or database SDKs.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }

  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof RegExp)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = stripUndefined(value);
      }
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Defensive null-safe payload getter
 */
export function safePayload<T extends object>(input: unknown, defaultFallback: T): T {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return defaultFallback;
  }
  return stripUndefined({ ...defaultFallback, ...input });
}
