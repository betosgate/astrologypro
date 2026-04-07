import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { callAstrologyApi } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";

// Extended allowlist for admin (includes all tool endpoints)
const ALLOWED_ENDPOINTS = [
  "western_horoscope",
  "natal_wheel_chart",
  "planets/tropical",
  "house_cusps/tropical",
  "birth_details",
  "astro_details",
  "sun_sign_prediction/daily",
  "sun_sign_prediction/weekly",
  "sun_sign_prediction/monthly",
  "sun_sign_prediction/yearly",
  // Solar Return
  "solar_return_details",
  "solar_return_planets",
  "solar_return_house_cusps",
  "solar_return_planet_aspects",
  "solar_return_planet_report",
  "solar_return_aspects_report",
  // Transits
  "tropical_transits/daily",
  "tropical_transits/weekly",
  "tropical_transits/monthly",
  "lunar_metrics",
  // Relationship
  "synastry_horoscope",
  "composite_horoscope",
  // Horary
  "horary_chart",
];

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, payload } = body as { endpoint: string; payload: Record<string, unknown> };

  if (!endpoint || !payload) {
    return NextResponse.json({ error: "endpoint and payload are required" }, { status: 400 });
  }

  if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 400 });
  }

  try {
    const result = await callAstrologyApi(endpoint, payload);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AstrologyAPI error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
