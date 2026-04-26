import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function searchCities(q: string) {
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Geocoding not configured" }, { status: 503 });
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&apiKey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  return searchCities(q);
}

export async function POST(req: NextRequest) {
  let body: { q?: string };

  try {
    body = (await req.json()) as { q?: string };
  } catch {
    return NextResponse.json({ results: [] });
  }

  return searchCities(body.q?.trim() ?? "");
}
