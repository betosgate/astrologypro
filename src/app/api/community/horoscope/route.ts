import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callAstrologyApi, BirthData } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { endpoint, birth } = body as { endpoint: string; birth: BirthData };

  if (!endpoint || !birth) {
    return NextResponse.json({ error: "endpoint and birth are required" }, { status: 400 });
  }

  // Allowlist of safe endpoints to prevent arbitrary API calls
  const ALLOWED_ENDPOINTS = [
    "western_horoscope",
    "natal_wheel_chart",
    "planets/tropical",
    "house_cusps/tropical",
    "natal_wheel_chart",
    "birth_details",
    "astro_details",
    "sun_sign_prediction/daily",
    "sun_sign_prediction/weekly",
    "sun_sign_prediction/monthly",
    "sun_sign_prediction/yearly",
  ];

  if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 400 });
  }

  // Map allowlisted endpoint names to reading_type enum values
  function toReadingType(ep: string): string {
    if (ep.includes("planet_return") || ep === "planet_return") return "planet_return";
    if (ep.includes("solar_return"))   return "solar_return";
    if (ep.includes("saturn_return"))  return "saturn_return";
    if (ep.includes("jupiter_return")) return "jupiter_return";
    if (ep.includes("transit"))        return "transit";
    if (ep.includes("natal"))          return "natal_chart";
    return "horoscope";
  }

  try {
    const result = await callAstrologyApi(endpoint, birth as unknown as Record<string, unknown>);

    // Fire-and-forget history record — does not block the response
    void Promise.resolve(
      createAdminClient()
        .from("astro_toolkit_readings")
        .insert({
          user_id:      user.id,
          reading_type: toReadingType(endpoint),
          input_data:   { endpoint, birth },
          result_data:  result as Record<string, unknown>,
        })
    ).catch(() => {});

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Astrology API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
