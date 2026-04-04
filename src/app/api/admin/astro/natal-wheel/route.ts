import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FREE_ASTRO_KEYS = (process.env.FREEASTROLOGY_API_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
const FREE_ASTRO_URL = "https://json.freeastrologyapi.com/western/natal-wheel-chart";

function pickKey(): string | undefined {
  if (!FREE_ASTRO_KEYS.length) return undefined;
  return FREE_ASTRO_KEYS[Math.floor(Math.random() * FREE_ASTRO_KEYS.length)];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  // Expected: { hours, minutes, date, month, year, latitude, longitude, timezone }
  const { hours, minutes, date, month, year, latitude, longitude, timezone } = body;

  if (hours === undefined || minutes === undefined || !date || !month || !year || latitude === undefined || longitude === undefined || timezone === undefined) {
    return NextResponse.json({ error: "Missing required birth data fields" }, { status: 400 });
  }

  const apiKey = pickKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const res = await fetch(FREE_ASTRO_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ hours, minutes, date, month, year, latitude, longitude, timezone }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FreeAstrologyAPI error ${res.status}: ${text}`);
    }

    const data = await res.json();
    // NestJS wraps in { results: { output: svgString } } — mirror that
    return NextResponse.json({ results: { output: data?.output ?? data } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Natal wheel error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
