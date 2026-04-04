import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  try {
    const result = await callAstrologyApi(endpoint, birth as unknown as Record<string, unknown>);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Astrology API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
