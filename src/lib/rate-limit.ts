/**
 * In-process sliding window rate limiter for Next.js App Router route handlers.
 *
 * Design constraints:
 * - Next.js on Vercel runs each serverless invocation in its own process.
 *   A module-level Map survives only within the same warm instance.
 * - This is intentionally lightweight: it protects against bursts within a
 *   single warm Lambda container and serves as a first line of defense.
 *   A distributed Redis/Upstash layer can be added later without changing the
 *   public API of this module.
 * - LRU eviction is applied on every write to keep memory bounded.
 *
 * Algorithm: sliding window — each entry stores an ordered list of request
 * timestamps within the window. On each call, timestamps older than
 * `windowMs` are pruned before the count is checked.
 *
 * Usage:
 *   const result = await rateLimit(identifier, limit, windowMs);
 *   if (!result.success) return rateLimitResponse(result);
 */

export interface RateLimitResult {
  /** Whether the request is allowed. */
  success: boolean;
  /** How many requests remain in the current window. */
  remaining: number;
  /** Unix epoch (ms) when the oldest request in the window expires. */
  reset: number;
}

// ── Internal store ────────────────────────────────────────────────────────────

interface Entry {
  /** Ordered list of request timestamps (oldest first). */
  timestamps: number[];
  /** Last-accessed time for LRU eviction. */
  lastAccess: number;
}

const store = new Map<string, Entry>();

/**
 * Maximum number of distinct identifiers kept in memory.
 * When this is exceeded the oldest-accessed 20 % of entries are evicted.
 */
const MAX_ENTRIES = 5_000;

function evictLRU(): void {
  if (store.size < MAX_ENTRIES) return;

  // Collect all entries sorted by lastAccess ascending (oldest first)
  const sorted = Array.from(store.entries()).sort(
    ([, a], [, b]) => a.lastAccess - b.lastAccess
  );

  // Evict the oldest 20 %
  const evictCount = Math.ceil(store.size * 0.2);
  for (let i = 0; i < evictCount; i++) {
    store.delete(sorted[i][0]);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check whether `identifier` is within its rate limit.
 *
 * @param identifier - A per-user or per-IP key, e.g. `"user:uuid"` or `"ip:1.2.3.4"`.
 * @param limit      - Maximum number of requests allowed per window.
 * @param windowMs   - Window size in milliseconds.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [], lastAccess: now };
    store.set(identifier, entry);
    evictLRU();
  }

  // Prune timestamps older than the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.lastAccess = now;

  const count = entry.timestamps.length;

  if (count >= limit) {
    // The oldest timestamp in the window dictates when the slot re-opens
    const reset = entry.timestamps[0] + windowMs;
    return { success: false, remaining: 0, reset };
  }

  entry.timestamps.push(now);

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    reset: entry.timestamps[0] + windowMs,
  };
}

// ── Response helper ───────────────────────────────────────────────────────────

/**
 * Build an RFC 9457 Problem Details 429 response with the required
 * `Retry-After` and `X-RateLimit-*` headers.
 *
 * @param result - The failed RateLimitResult (success === false).
 * @param detail - Human-readable explanation surfaced to the caller.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  detail = "Too many requests. Please slow down and try again later."
): Response {
  const retryAfterSec = Math.ceil((result.reset - Date.now()) / 1_000);

  return new Response(
    JSON.stringify({
      type: "https://httpstatus.es/429",
      title: "Too Many Requests",
      status: 429,
      detail,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/problem+json",
        "Retry-After": String(Math.max(retryAfterSec, 1)),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(result.reset / 1_000)),
      },
    }
  );
}

// ── Convenience: extract identifier from a request ───────────────────────────

/**
 * Extract the best available IP from a Next.js Request.
 *
 * Vercel sets `x-real-ip` and `x-forwarded-for` on every invocation.
 * Falls back to `"unknown"` when neither header is present (local dev).
 */
export function getIpIdentifier(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;

  return "ip:unknown";
}
