import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CITY_SEARCH_URL =
  "https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon";

interface CityResult {
  val: string;
  key: {
    lat: number;
    lng: number;
    timezone: { offset_string: string };
  };
}

interface CitySearchResponse {
  status: string;
  res: CityResult[];
}

export interface CityOption {
  label: string;
  lat: number;
  lng: number;
  tzone: string;
}

// GET /api/community/nativity-chart/city-search?q=cityname
export async function GET(req: NextRequest) {
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

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(CITY_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchcondition: { search_string: q },
        secret: "na",
        token: "",
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as CitySearchResponse;

    if (data.status !== "success" || !Array.isArray(data.res)) {
      return NextResponse.json({ results: [] });
    }

    const results: CityOption[] = data.res.map((item) => ({
      label: item.val,
      lat: item.key.lat,
      lng: item.key.lng,
      tzone: item.key.timezone.offset_string,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
