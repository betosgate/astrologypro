import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Helper for the centralised `astro_system_settings` table.
 *
 * Three settings types:
 *   - ASTROLOGY_API     : { key_name, key_value (= access_key), secret_value (= secret_key) }
 *   - FREEASTROLOGY_API : { key_name, key_value (= API key), secret_value: null }
 *   - SYSTEM_CONFIG     : { key_name, key_value (= URL or scalar), secret_value: null }
 *
 * Read paths fall back to legacy sources during the dual-read window:
 *   - ASTROLOGY_API     -> falls back to the existing `astrology_api_keys` table
 *   - FREEASTROLOGY_API -> falls back to the `FREEASTROLOGY_API_KEYS` env var
 *   - SYSTEM_CONFIG     -> falls back to the named env var
 *
 * Once every consumer has been switched to call this helper and the data
 * has been verified in `astro_system_settings`, a follow-up migration can
 * drop `astrology_api_keys` and the env-var fallbacks can be deleted.
 */

export type AstroSettingType =
  | "ASTROLOGY_API"
  | "FREEASTROLOGY_API"
  | "SYSTEM_CONFIG";

export interface AstroSystemSetting {
  id: string;
  type: AstroSettingType;
  key_name: string;
  key_value: string;
  secret_value: string | null;
  status: "active" | "inactive";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns every active row of the given type from astro_system_settings,
 * ordered by `created_at` (so callers can pick the first / round-robin).
 *
 * Falls back to the legacy source if the new table is empty for the type.
 */
export async function listActiveAstroSettings(
  type: AstroSettingType,
): Promise<Array<Pick<AstroSystemSetting, "key_name" | "key_value" | "secret_value">>> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("astro_system_settings")
    .select("key_name, key_value, secret_value, created_at")
    .eq("type", type)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    // Table missing (42P01) or any other failure — fall back.
    return fallbackList(type);
  }

  if (data && data.length > 0) {
    return data.map(({ key_name, key_value, secret_value }) => ({
      key_name,
      key_value,
      secret_value,
    }));
  }

  return fallbackList(type);
}

/**
 * Convenience: returns the first active row of the given type, or null.
 */
export async function getActiveAstroSetting(
  type: AstroSettingType,
): Promise<{ key_name: string; key_value: string; secret_value: string | null } | null> {
  const all = await listActiveAstroSettings(type);
  return all[0] ?? null;
}

/**
 * Convenience: returns a SYSTEM_CONFIG value by key_name (e.g.
 * "ASTRO_AI_API_URL"), with env-var fallback if the row is missing or
 * the table doesn't exist yet.
 */
export async function getSystemConfigValue(
  keyName: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("astro_system_settings")
    .select("key_value")
    .eq("type", "SYSTEM_CONFIG")
    .eq("key_name", keyName)
    .eq("status", "active")
    .limit(1);

  if (!error && data && data.length > 0) return data[0].key_value;

  // Env var fallback
  return process.env[keyName] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Legacy fallbacks
// ────────────────────────────────────────────────────────────────────────────

async function fallbackList(
  type: AstroSettingType,
): Promise<Array<Pick<AstroSystemSetting, "key_name" | "key_value" | "secret_value">>> {
  if (type === "ASTROLOGY_API") {
    return fallbackAstrologyApi();
  }
  if (type === "FREEASTROLOGY_API") {
    return fallbackFreeAstrologyApi();
  }
  // SYSTEM_CONFIG fallback is handled per-key via getSystemConfigValue.
  return [];
}

async function fallbackAstrologyApi(): Promise<
  Array<Pick<AstroSystemSetting, "key_name" | "key_value" | "secret_value">>
> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("astrology_api_keys")
      .select("label, access_key, secret_key, is_active, last_used_at")
      .eq("is_active", true)
      .order("last_used_at", { ascending: true, nullsFirst: true });

    return (data ?? []).map((r: { label: string | null; access_key: string; secret_key: string }) => ({
      key_name: r.label ?? "Default",
      key_value: r.access_key,
      secret_value: r.secret_key,
    }));
  } catch {
    return [];
  }
}

function fallbackFreeAstrologyApi(): Array<
  Pick<AstroSystemSetting, "key_name" | "key_value" | "secret_value">
> {
  const raw = process.env.FREEASTROLOGY_API_KEYS ?? "";
  return raw
    .split(",")
    .map((k, i) => ({
      key_name: `env_key_${i + 1}`,
      key_value: k.trim(),
      secret_value: null,
    }))
    .filter((entry) => entry.key_value.length > 0);
}
