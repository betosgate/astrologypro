import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import {
  getActiveAstroSetting,
  getSystemConfigValue,
} from "@/lib/astro/system-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/astro/fetch-config
 *
 * Returns the resolved active configuration for a list of named keys.
 * Implements the spec in
 * `tasks/08.04.2026/astro-toolkit/astro_api_key_save_task_in_db.md`.
 *
 * Request body:
 *   { keys: string[] }
 *
 * Recognised key names:
 *   - "ASTROLOGY_API"     → returns { access_key, secret_key } from the
 *                           first active astro_system_settings row of type
 *                           ASTROLOGY_API. Falls back to the legacy
 *                           astrology_api_keys table during the cutover
 *                           window via the helper.
 *   - "FREEASTROLOGY_API" → returns { api_key } from the first active
 *                           astro_system_settings row of type
 *                           FREEASTROLOGY_API. Falls back to the
 *                           FREEASTROLOGY_API_KEYS env var.
 *   - any other string    → treated as a SYSTEM_CONFIG key_name (e.g.
 *                           "ASTRO_AI_API_URL"). Returns the active
 *                           key_value as a scalar string. Falls back to
 *                           process.env[<key>].
 *
 * Response shape (matches the spec):
 *   {
 *     ASTROLOGY_API: { access_key, secret_key } | null,
 *     FREEASTROLOGY_API: { api_key } | null,
 *     ASTRO_AI_API_URL: "https://..." | null,
 *     ASTRO_PLANET_RETURN_URL: "https://..." | null,
 *     ...
 *   }
 *
 * Security: admin-only. The response includes credential material —
 * exposing it publicly would defeat the purpose of having RLS on
 * astro_system_settings.
 *
 * Errors: 401 unauth, 400 invalid body, 422 missing or empty keys array
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { keys?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const keys = body.keys;
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json(
      { error: "keys must be a non-empty array of strings" },
      { status: 422 },
    );
  }

  const requested: string[] = keys
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map((k) => k.trim());

  if (requested.length === 0) {
    return NextResponse.json(
      { error: "keys must contain at least one non-empty string" },
      { status: 422 },
    );
  }

  // Resolve each requested key in parallel.
  const entries = await Promise.all(
    requested.map(async (key) => {
      if (key === "ASTROLOGY_API") {
        const row = await getActiveAstroSetting("ASTROLOGY_API");
        if (!row) return [key, null] as const;
        return [
          key,
          {
            access_key: row.key_value,
            secret_key: row.secret_value ?? null,
          },
        ] as const;
      }

      if (key === "FREEASTROLOGY_API") {
        const row = await getActiveAstroSetting("FREEASTROLOGY_API");
        if (!row) return [key, null] as const;
        return [key, { api_key: row.key_value }] as const;
      }

      // Anything else is a SYSTEM_CONFIG key_name (e.g. ASTRO_AI_API_URL).
      const value = await getSystemConfigValue(key);
      return [key, value] as const;
    }),
  );

  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }

  return NextResponse.json(result);
}
