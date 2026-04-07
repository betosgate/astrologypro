import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") ?? "";
  const q = sp.get("q") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_entities")
    .select("id, name, entity_type, flag_emoji, region, is_active", { count: "exact" })
    .eq("is_active", true);

  if (type) {
    query = query.eq("entity_type", type);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,region.ilike.%${q}%`);
  }

  query = query
    .order("name", { ascending: true })
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
    entities: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    name?: string;
    entity_type?: string;
    region?: string;
    flag_emoji?: string;
    notes?: string;
  };

  const { name, entity_type, region, flag_emoji, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "name is required" },
      { status: 422 }
    );
  }

  const VALID_TYPES = ["country", "city", "institution", "market", "commodity", "organization", "other"] as const;
  if (!entity_type || !(VALID_TYPES as readonly string[]).includes(entity_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "entity_type is required and must be valid" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_entities")
    .insert({
      name: name.trim(),
      entity_type,
      region: region ?? null,
      flag_emoji: flag_emoji ?? null,
      notes: notes ?? null,
      is_active: true,
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
