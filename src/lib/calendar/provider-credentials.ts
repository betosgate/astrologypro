import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Calendar provider credential resolution.
 *
 * The OAuth client credentials for Google and Microsoft Calendar used to
 * live exclusively in env vars. The admin Calendar Config module
 * (tasks/09.04.2026/calendar-module/11-api-keys-config.md) introduces
 * two admin-managed key-value tables:
 *
 *   google_api_keys      — key | value | description | is_active
 *   microsoft_api_keys   — key | value | description | is_active
 *
 * Runtime reads now flow through the helpers below. The lookup order is:
 *
 *   1. active row in the provider table with a matching `key`, newest first
 *   2. the corresponding env var (existing behavior)
 *
 * This means deploying this code change does NOT break anything — if no
 * admin populates the tables, every read falls through to the env vars
 * that were already there. Once an admin saves a `client_id` row via
 * /admin/calendar-config, that value takes precedence on the next read.
 *
 * The result is cached in-process for 60 seconds so a high-traffic
 * OAuth callback or webhook burst doesn't hammer the DB. Cache is
 * keyed on `{table}:{key}` and is invalidated automatically when TTL
 * expires. Admins saving a row through the UI will see the new value
 * at most 60 seconds later.
 */

type ProviderTable = "google_api_keys" | "microsoft_api_keys";

interface CacheEntry {
  value: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, CacheEntry>();

async function readSetting(
  table: ProviderTable,
  key: string,
): Promise<string | null> {
  const cacheKey = `${table}:${key.toLowerCase()}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from(table)
      .select("value")
      .eq("is_active", true)
      .ilike("key", key)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const value = error || !data ? null : (data.value as string);
    cache.set(cacheKey, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  } catch {
    // Defensive: if the table doesn't exist yet (migration not applied),
    // or the DB is unreachable, fall through to the env var path.
    cache.set(cacheKey, { value: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }
}

/**
 * Resolve a credential value. Prefers the admin table, falls back to the
 * provided environment variable. Returns `null` if neither source has a
 * usable value (caller decides whether to throw or return a default).
 */
async function resolveCredential(
  table: ProviderTable,
  key: string,
  envValue: string | undefined,
): Promise<string | null> {
  const dbValue = await readSetting(table, key);
  if (dbValue && dbValue.trim().length > 0) return dbValue;
  if (envValue && envValue.trim().length > 0) return envValue;
  return null;
}

// ── Google credentials ────────────────────────────────────────────────────

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export async function getGoogleCredentials(): Promise<GoogleCredentials> {
  const [clientId, clientSecret, redirectUri] = await Promise.all([
    resolveCredential("google_api_keys", "client_id", process.env.GOOGLE_CLIENT_ID),
    resolveCredential(
      "google_api_keys",
      "client_secret",
      process.env.GOOGLE_CLIENT_SECRET,
    ),
    resolveCredential(
      "google_api_keys",
      "redirect_uri",
      process.env.GOOGLE_REDIRECT_URI,
    ),
  ]);

  return {
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
    redirectUri:
      redirectUri ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/calendar/callback`,
  };
}

// ── Microsoft credentials ─────────────────────────────────────────────────

export interface MicrosoftCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId: string;
}

export async function getMicrosoftCredentials(): Promise<MicrosoftCredentials> {
  const [clientId, clientSecret, redirectUri, tenantId] = await Promise.all([
    resolveCredential(
      "microsoft_api_keys",
      "client_id",
      process.env.MICROSOFT_CLIENT_ID,
    ),
    resolveCredential(
      "microsoft_api_keys",
      "client_secret",
      process.env.MICROSOFT_CLIENT_SECRET,
    ),
    resolveCredential(
      "microsoft_api_keys",
      "redirect_uri",
      process.env.MICROSOFT_REDIRECT_URI,
    ),
    resolveCredential(
      "microsoft_api_keys",
      "tenant_id",
      process.env.MICROSOFT_TENANT_ID,
    ),
  ]);

  return {
    clientId: clientId ?? "",
    clientSecret: clientSecret ?? "",
    redirectUri:
      redirectUri ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/api/calendar/microsoft/callback`,
    // Microsoft default tenant is "common" for multi-tenant apps — matches
    // the prior hardcoded TENANT_ID in microsoft-calendar.ts.
    tenantId: tenantId ?? "common",
  };
}

/**
 * Clear the in-process credential cache. Called from the admin API routes
 * after a successful create/update/delete so the next runtime read picks
 * up the new value immediately instead of waiting 60 s.
 */
export function invalidateCredentialsCache(
  table?: ProviderTable,
  key?: string,
): void {
  if (!table) {
    cache.clear();
    return;
  }
  if (!key) {
    for (const k of Array.from(cache.keys())) {
      if (k.startsWith(`${table}:`)) cache.delete(k);
    }
    return;
  }
  cache.delete(`${table}:${key.toLowerCase()}`);
}
