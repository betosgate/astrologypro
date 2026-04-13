import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getSystemConfigValue } from "@/lib/astro/system-settings";

export const dynamic = "force-dynamic";

// Reads ASTRO_PLANET_RETURN_URL from astro_system_settings (type=SYSTEM_CONFIG)
// first, then falls back to the env var via the helper. The previous
// hardcoded Lambda URL has been removed — the route now returns 500 with a
// clear message when neither source is configured, which is the right
// failure mode (the URL is environment-specific and silently using a stale
// fallback would be wrong).

const ALLOWED_STEPS = [
  "jupiter_return",
  "saturn_return",
  "mars_return",
  "uranus_return",
  "astrology_report_weekly",
  "astrology_report_monthly",
];

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { steps } = body as { steps: string };

  if (!steps || !ALLOWED_STEPS.includes(steps)) {
    return NextResponse.json({ error: "Invalid steps value" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astrologypro.com";
  const configRes = await fetch(`${baseUrl}/api/astro/fetch-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys: ["ASTRO_PLANET_RETURN_URL"] }),
  });
  const config = await configRes.json().catch(() => ({}));
  const lambdaUrl = config?.ASTRO_PLANET_RETURN_URL;

  console.log("lambdaUrl", lambdaUrl);

  if (!lambdaUrl) {
    return NextResponse.json(
      {
        error:
          "ASTRO_PLANET_RETURN_URL is not configured (fetch-config returned null).",
      },
      { status: 500 }
    );
  }

  try {
    console.log("body123", JSON.stringify(body));
    const res = await fetch(lambdaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log("res123", res);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lambda error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Planet return error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
