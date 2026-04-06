import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";



export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const createdFrom = sp.get("created_from") ?? "";
  const createdTo = sp.get("created_to") ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("ingress_charts")
    .select("id, title, ingress_type, importance, is_published, is_social_advo, validity_start, validity_end, location_name, author_name, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ charts: data ?? [], total: count ?? 0, page, hasMore: offset + limit < (count ?? 0) });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, ingress_type, importance, short_description, effective_time_period, event_time_period,
    event_timestamp, validity_start, validity_end, location_name, location_lat, location_lon, location_timezone,
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
      location_lat: location_lat ?? null,
      location_lon: location_lon ?? null,
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
