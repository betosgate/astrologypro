import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import {
  getActiveAstroSetting,
  getSystemConfigValue,
} from "@/lib/astro/system-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/astro-system-settings/active
 *
 * Returns the resolved "what should the app actually use right now" view:
 *   - one active credential row for ASTROLOGY_API
 *   - one active credential row for FREEASTROLOGY_API
 *   - the SYSTEM_CONFIG values for the URLs the app reads at runtime
 *
 * Each value reflects the dual-read fallback chain in
 * `src/lib/astro/system-settings.ts`: read astro_system_settings first,
 * fall back to astrology_api_keys / env vars if missing.
 *
 * Admin-only because the response includes credential material.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [astrologyApi, freeAstrologyApi, aiUrl, planetReturnUrl] =
    await Promise.all([
      getActiveAstroSetting("ASTROLOGY_API"),
      getActiveAstroSetting("FREEASTROLOGY_API"),
      getSystemConfigValue("ASTRO_AI_API_URL"),
      getSystemConfigValue("ASTRO_PLANET_RETURN_URL"),
    ]);

  return NextResponse.json({
    ok: true,
    active: {
      ASTROLOGY_API: astrologyApi,
      FREEASTROLOGY_API: freeAstrologyApi,
    },
    system_config: {
      ASTRO_AI_API_URL: aiUrl,
      ASTRO_PLANET_RETURN_URL: planetReturnUrl,
    },
  });
}
