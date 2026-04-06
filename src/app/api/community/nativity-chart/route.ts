import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callAstrologyApi } from "@/lib/astrology-api";

export const dynamic = "force-dynamic";

interface BirthPayload {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: string; // e.g. "+05:30"
  cityLabel: string;
}

interface WesternHoroscopeResponse {
  planets: unknown[];
  houses: unknown[];
  aspects: unknown[];
  ascendant: unknown;
  midheaven: unknown;
  vertex: unknown;
  lilith: unknown;
  [key: string]: unknown;
}

interface NatalWheelChartResponse {
  status: boolean;
  chart_url: string;
}

function parseTzone(tzone: string): number {
  // Accepts "+05:30" or "-05:00" or numeric string like "5.5"
  if (/^[+-]?\d+(\.\d+)?$/.test(tzone)) {
    return parseFloat(tzone);
  }
  const match = tzone.match(/^([+-])(\d{1,2}):(\d{2})$/);
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours + minutes / 60);
  }
  return 0;
}

// POST /api/community/nativity-chart
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member || member.membership_status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as BirthPayload;
  const { day, month, year, hour, min, lat, lon, tzone, cityLabel } = body;

  // Validate required fields
  if (
    day == null || month == null || year == null ||
    hour == null || min == null ||
    lat == null || lon == null || !tzone || !cityLabel
  ) {
    return NextResponse.json(
      { error: "All birth fields are required: day, month, year, hour, min, lat, lon, tzone, cityLabel" },
      { status: 422 }
    );
  }

  // Additional range validation
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2099) {
    return NextResponse.json({ error: "Invalid date values" }, { status: 422 });
  }
  if (hour < 0 || hour > 23 || min < 0 || min > 59) {
    return NextResponse.json({ error: "Invalid time values" }, { status: 422 });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 422 });
  }

  const tzoneNum = parseTzone(tzone);

  const astrologyPayload = {
    day,
    month,
    year,
    hour,
    min,
    lat,
    lon,
    tzone: tzoneNum,
  };

  try {
    // Call western_horoscope and natal_wheel_chart in parallel
    const [astroData, chartData] = await Promise.all([
      callAstrologyApi<WesternHoroscopeResponse>("western_horoscope", astrologyPayload),
      callAstrologyApi<NatalWheelChartResponse>("natal_wheel_chart", astrologyPayload),
    ]);

    const chartUrl = chartData.chart_url ?? null;

    // Persist to birth_chart_results (non-fatal if it fails)
    const adminClient = createAdminClient();
    await adminClient.from("birth_chart_results").insert({
      user_id: user.id,
      community_member_id: member.id,
      city_label: cityLabel,
      birth_day: day,
      birth_month: month,
      birth_year: year,
      birth_hour: hour,
      birth_min: min,
      lat,
      lon,
      tzone,
      chart_url: chartUrl,
      astro_data: astroData,
    });

    return NextResponse.json({
      astroData,
      chartUrl,
      birth: { day, month, year, hour, min, lat, lon, tzone, cityLabel },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Astrology API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
