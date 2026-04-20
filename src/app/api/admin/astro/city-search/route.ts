import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Geocoding is not sensitive — it's a server-side proxy to Geoapify so we
  // don't leak the API key. Originally this was admin-gated, but the toolkit
  // session view (src/app/admin/horoscope/session/[bookingId]) lets diviners
  // fill in missing birth cities for their own bookings. Diviners are
  // authenticated but NOT admins, so relax the check to "any authenticated
  // user." The parent URL prefix (/api/admin/*) already rejects unauthenticated
  // requests at the middleware layer (src/lib/supabase/middleware.ts).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { q } = body as { q: string };

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Geocoding not configured" }, { status: 503 });

  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q.trim())}&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geoapify error ${res.status}`);
    const data = await res.json();

    const results = (data.features ?? []).slice(0, 8).map((item: any) => {
      const p = item.properties;
      return {
        label: p.formatted,
        lat: p.lat,
        lng: p.lon,
        timezone: {
          name: p.timezone?.name ?? "",
          offset_string: p.timezone?.offset_STD ?? "+00:00",
          utcOffset: p.timezone?.offset_STD ?? "+00:00",
        },
      };
    });

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Geocoding error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
