import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const entityType = sp.get("entity_type") ?? "";
  const search = sp.get("search") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Stats query — counts by type across all active entities
  const statsRes = await admin
    .from("mundane_entities")
    .select("entity_type, is_active", { count: "exact" });

  const allRows = (statsRes.data ?? []) as Array<{ entity_type: string; is_active: boolean }>;
  const totalEntities = statsRes.count ?? allRows.length;
  const activeCount = allRows.filter((r) => r.is_active).length;

  const typeCounts: Record<string, number> = {};
  for (const r of allRows) {
    typeCounts[r.entity_type] = (typeCounts[r.entity_type] ?? 0) + 1;
  }

  // Main query with counts of associated charts per entity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_entities")
    .select("id, name, entity_type, region, flag_emoji, is_active, created_at", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%`);
  }
  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  query = query
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get chart counts per entity
  const entityIds = (data ?? []).map((e: { id: string }) => e.id);
  let chartCountMap: Record<string, number> = {};
  if (entityIds.length > 0) {
    const { data: chartCounts } = await admin
      .from("mundane_entity_charts")
      .select("entity_id")
      .in("entity_id", entityIds);
    for (const c of chartCounts ?? []) {
      const ec = c as { entity_id: string };
      chartCountMap[ec.entity_id] = (chartCountMap[ec.entity_id] ?? 0) + 1;
    }
  }

  const entities = (data ?? []).map((e: { id: string; name: string; entity_type: string; region: string | null; flag_emoji: string | null; is_active: boolean; created_at: string }) => ({
    ...e,
    chart_count: chartCountMap[e.id] ?? 0,
  }));

  return NextResponse.json({
    entities,
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
    stats: { totalEntities, activeCount, typeCounts },
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    entity_type?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    flag_emoji?: string;
    notes?: string;
    is_active?: boolean;
  };
  const { name, entity_type, region, latitude, longitude, timezone, flag_emoji, notes, is_active } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (!entity_type) {
    return NextResponse.json({ error: "entity_type is required" }, { status: 422 });
  }

  const VALID_TYPES = ["country", "city", "institution", "market", "commodity", "organization", "other"] as const;
  if (!(VALID_TYPES as readonly string[]).includes(entity_type)) {
    return NextResponse.json({ error: "Invalid entity_type" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_entities")
    .insert({
      name: name.trim(),
      entity_type,
      region: region ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      timezone: timezone ?? null,
      flag_emoji: flag_emoji ?? null,
      notes: notes ?? null,
      is_active: is_active ?? true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
