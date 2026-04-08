import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { listActiveAstroSettings } from "@/lib/astro/system-settings";

export const dynamic = "force-dynamic";

const FREE_ASTRO_URL = "https://json.freeastrologyapi.com/western/natal-wheel-chart";

/**
 * Fetches every active FreeAstrologyAPI key.
 *
 * Reads from astro_system_settings (type=FREEASTROLOGY_API) first via the
 * helper, which transparently falls back to the legacy
 * `FREEASTROLOGY_API_KEYS` comma-delimited env var when the new table is
 * empty. Once the cutover is complete and every environment has rows in
 * astro_system_settings, the env var can be removed.
 */
async function getFreeAstroKeys(): Promise<string[]> {
  const rows = await listActiveAstroSettings("FREEASTROLOGY_API");
  return rows.map((r) => r.key_value).filter((k) => k && k.length > 0);
}

function formatFreeAstroError(status: number, bodyText: string, keyIndex?: number) {
  const keyLabel = keyIndex == null ? "" : ` [key ${keyIndex + 1}]`;
  return `FreeAstrologyAPI error ${status}${keyLabel}: ${bodyText}`;
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // Expected: { hours, minutes, date, month, year, latitude, longitude, timezone }
  const { hours, minutes, date, month, year, latitude, longitude, timezone } = body;

  if (hours === undefined || minutes === undefined || !date || !month || !year || latitude === undefined || longitude === undefined || timezone === undefined) {
    return NextResponse.json({ error: "Missing required birth data fields" }, { status: 400 });
  }

  const apiKeys = await getFreeAstroKeys();
  if (apiKeys.length === 0) {
    return NextResponse.json(
      {
        error:
          "No active FreeAstrologyAPI keys configured. Add a row of type=FREEASTROLOGY_API at /admin/astro-system-settings or set the FREEASTROLOGY_API_KEYS env var.",
      },
      { status: 500 }
    );
  }

  const payload = { hours, minutes, date, month, year, latitude, longitude, timezone };

  try {
    const attempted = new Set<string>();
    let lastError: string | null = null;

    for (let index = 0; index < apiKeys.length; index++) {
      const apiKey = apiKeys[index];
      if (attempted.has(apiKey)) continue;
      attempted.add(apiKey);

      const res = await fetch(FREE_ASTRO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // NestJS wraps in { results: { output: svgString } } — mirror that
        return NextResponse.json({ results: { output: data?.output ?? data } });
      }

      const text = await res.text();
      lastError = formatFreeAstroError(res.status, text, index);

      // Retry the next configured key on auth/rate-limit style failures.
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        continue;
      }

      throw new Error(lastError);
    }

    throw new Error(lastError ?? "FreeAstrologyAPI request failed");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Natal wheel error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
