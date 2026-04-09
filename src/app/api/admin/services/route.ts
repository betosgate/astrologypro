import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SELECT_COLS =
  "id, diviner_id, name, slug, category, description, duration_minutes, base_price, is_active, is_featured, is_primary, requires_birth_data, sort_order, created_at";

/**
 * GET /api/admin/services
 * List all services across all diviners. Supports pagination + search.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10)));
  const search = sp.get("search")?.trim() || null;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();
  let query = admin.from("services").select(SELECT_COLS, { count: "exact" });

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, count, error } = await query
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ services: data ?? [], total: count ?? 0, page, pageSize });
}

/**
 * POST /api/admin/services
 * Create a new service.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const diviner_id = typeof body.diviner_id === "string" ? body.diviner_id : null;
  const category = typeof body.category === "string" ? body.category : "astrology";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const duration_minutes = typeof body.duration_minutes === "number" ? body.duration_minutes : 60;
  const base_price = typeof body.base_price === "number" ? body.base_price : 0;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 422 });
  if (!diviner_id) return NextResponse.json({ error: "diviner_id is required." }, { status: 422 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const admin = createAdminClient();
  const { data, error } = await admin.from("services").insert({
    diviner_id,
    name,
    slug,
    category,
    description,
    duration_minutes,
    base_price,
    is_active: body.is_active !== false,
    is_featured: !!body.is_featured,
    is_primary: body.is_primary !== false,
    requires_birth_data: body.requires_birth_data !== false,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}
