import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_EVENT_TYPES = [
  "ingress", "lunation", "eclipse", "conjunction", "opposition", "station",
  "retrograde", "direct", "great_conjunction", "return", "solar_arc", "custom",
] as const;

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const monthParam = sp.get("month") ?? ""; // e.g. "2026-04"
  const typesParam = sp.get("types") ?? ""; // e.g. "ingress,eclipse"

  // Default to current month
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1; // 0-based
  }

  // Start of month (UTC) and end of month (UTC)
  const from = new Date(Date.UTC(year, month, 1)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_astro_events")
    .select("*")
    .gte("event_datetime_utc", from)
    .lte("event_datetime_utc", to);

  // Filter by types if provided
  if (typesParam) {
    const types = typesParam
      .split(",")
      .map((t) => t.trim())
      .filter((t) => (VALID_EVENT_TYPES as readonly string[]).includes(t));
    if (types.length > 0) {
      query = query.in("event_type", types);
    }
  }

  query = query
    .order("event_datetime_utc", { ascending: true })
    .order("id", { ascending: true });

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  const events = data ?? [];

  // Compute stats
  const stats = {
    total: events.length,
    eclipses: events.filter((e: { event_type: string }) => e.event_type === "eclipse").length,
    ingresses: events.filter((e: { event_type: string }) => e.event_type === "ingress").length,
    lunations: events.filter((e: { event_type: string }) => e.event_type === "lunation").length,
    stations: events.filter((e: { event_type: string }) => e.event_type === "station").length,
    conjunctions: events.filter((e: { event_type: string }) => e.event_type === "conjunction").length,
  };

  return NextResponse.json({
    events,
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    stats,
  });
}
