import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const entityId = sp.get("entity_id") ?? "";
  const isCurrent = sp.get("is_current") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_leaders")
    .select(
      "id, full_name, office_title, country_entity_id, office_start_date, office_end_date, is_current, birth_date, birth_location, birth_data_confidence, tags, is_public, created_at",
      { count: "exact" }
    );

  if (entityId) {
    query = query.eq("country_entity_id", entityId);
  }
  if (isCurrent === "true") {
    query = query.eq("is_current", true);
  } else if (isCurrent === "false") {
    query = query.eq("is_current", false);
  }

  query = query
    .order("full_name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    leaders: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    full_name?: string;
    office_title?: string;
    country_entity_id?: string | null;
    office_start_date?: string | null;
    office_end_date?: string | null;
    is_current?: boolean;
    birth_date?: string | null;
    birth_time?: string | null;
    birth_location?: string | null;
    birth_lat?: number | null;
    birth_lon?: number | null;
    birth_timezone?: string | null;
    birth_data_source?: string | null;
    birth_data_confidence?: string | null;
    notes?: string | null;
    tags?: string[];
    is_public?: boolean;
  };

  if (!body.full_name?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "full_name is required" },
      { status: 422 }
    );
  }

  const VALID_CONFIDENCE = ["AA", "A", "B", "C", "X"] as const;
  if (
    body.birth_data_confidence &&
    !(VALID_CONFIDENCE as readonly string[]).includes(body.birth_data_confidence)
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "birth_data_confidence must be one of AA, A, B, C, X" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_leaders")
    .insert({
      full_name: body.full_name.trim(),
      office_title: body.office_title ?? null,
      country_entity_id: body.country_entity_id ?? null,
      office_start_date: body.office_start_date ?? null,
      office_end_date: body.office_end_date ?? null,
      is_current: body.is_current ?? true,
      birth_date: body.birth_date ?? null,
      birth_time: body.birth_time ?? null,
      birth_location: body.birth_location ?? null,
      birth_lat: body.birth_lat ?? null,
      birth_lon: body.birth_lon ?? null,
      birth_timezone: body.birth_timezone ?? null,
      birth_data_source: body.birth_data_source ?? null,
      birth_data_confidence: body.birth_data_confidence ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
      is_public: body.is_public ?? true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
