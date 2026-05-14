import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page    = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const search  = sp.get("search") ?? "";
  const ingressType = sp.get("ingress_type") ?? "";
  const importance  = sp.get("importance") ?? "";
  const sectorsParam = sp.get("sectors") ?? "";
  const view    = sp.get("view") ?? ""; // "upcoming" | "past" | ""
  const sort    = sp.get("sort") ?? "newest";
  // Legacy date range params (keep backward-compat)
  const createdFrom = sp.get("created_from") ?? "";
  const createdTo   = sp.get("created_to") ?? "";

  const limit  = 12;
  const offset = (page - 1) * limit;
  const today  = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const admin = createAdminClient();

  // ── Stats (always computed from all charts, ignoring current filters) ────────
  const [statsRes] = await Promise.all([
    admin
      .from("ingress_charts")
      .select("is_published, is_social_advo, validity_start", { count: "exact" }),
  ]);

  let total_stat = 0;
  let published_stat = 0;
  let upcoming_stat  = 0;
  let social_advo_stat = 0;

  if (!statsRes.error && statsRes.data) {
    total_stat       = statsRes.count ?? statsRes.data.length;
    published_stat   = statsRes.data.filter((c) => c.is_published).length;
    upcoming_stat    = statsRes.data.filter(
      (c) => c.validity_start && c.validity_start >= today
    ).length;
    social_advo_stat = statsRes.data.filter((c) => c.is_social_advo).length;
  }

  // ── Main filtered query ──────────────────────────────────────────────────────
  let query: any = admin
    .from("ingress_charts")
    .select(
      "id, title, ingress_type, importance, short_description, is_social_advo, validity_start, validity_end, location_name, author_name, sector_focus, tags, created_at, event_timestamp",
      { count: "exact" }
    );

  // Search: title or location_name
  if (search) {
    query = query.or(`title.ilike.%${search}%,location_name.ilike.%${search}%`);
  }

  // Ingress type exact match
  if (ingressType) {
    query = query.eq("ingress_type", ingressType);
  }

  // Importance exact match
  if (importance) {
    query = query.eq("importance", importance);
  }

  // Sector focus: chart must contain ANY of the requested sectors
  if (sectorsParam) {
    const sectorList = sectorsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (sectorList.length === 1) {
      query = query.contains("sector_focus", [sectorList[0]]);
    } else if (sectorList.length > 1) {
      // overlaps — chart has at least one of the sectors
      query = query.overlaps("sector_focus", sectorList);
    }
  }

  // View: upcoming vs past (based on validity_start)
  if (view === "upcoming") {
    query = query.gte("validity_start", today);
  } else if (view === "past") {
    query = query.lt("validity_start", today);
  }

  // Legacy date range
  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo)   query = query.lte("created_at", createdTo + "T23:59:59");

  // Sort
  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true }).order("id", { ascending: true });
      break;
    case "event_asc":
      query = query
        .order("event_timestamp", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });
      break;
    case "event_desc":
      query = query
        .order("event_timestamp", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });
      break;
    case "name_asc":
      query = query.order("title", { ascending: true }).order("id", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    charts: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
    // Stats
    published: published_stat,
    upcoming: upcoming_stat,
    social_advo: social_advo_stat,
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, ingress_type, importance, short_description, effective_time_period, event_time_period,
    event_timestamp, validity_start, validity_end,
    location_name, location_lat, location_lng, location_lon, location_timezone,
    system_interpretation, chart_data, sector_analysis, tags, sector_focus,
    is_social_advo, is_published, author_name, author_email,
  } = body;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ingress_charts")
    .insert({
      title,
      ingress_type: ingress_type ?? null,
      importance: importance ?? "High Impact",
      short_description: short_description ?? null,
      effective_time_period: effective_time_period ?? null,
      event_time_period: event_time_period ?? null,
      event_timestamp: event_timestamp ?? null,
      validity_start: validity_start ?? null,
      validity_end: validity_end ?? null,
      location_name: location_name ?? null,
      // Accept location_lng (new) or location_lon (legacy) interchangeably
      location_lat: location_lat ?? null,
      location_lon: location_lng ?? location_lon ?? null,
      location_timezone: location_timezone ?? null,
      system_interpretation: system_interpretation ?? null,
      chart_data: chart_data ?? null,
      sector_analysis: sector_analysis ?? null,
      tags: tags ?? [],
      sector_focus: sector_focus ?? [],
      is_social_advo: is_social_advo ?? false,
      is_published: is_published ?? false,
      author_name: author_name ?? null,
      author_email: author_email ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
