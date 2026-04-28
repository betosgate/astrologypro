import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ritual-asset-mappings
 *
 * Optional query params:
 *   ?scope=global              — only global mappings
 *   ?ritualDefinitionId=<uuid> — only per-ritual mappings for that ritual
 *
 * Without filters returns every mapping with the joined asset row so
 * the admin UI can render scope, target tag, asset, and active flag.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const ritualDefinitionId = searchParams.get("ritualDefinitionId");
  const q_tag = searchParams.get("q_tag");
  const asset_id = searchParams.get("asset_id");
  const active = searchParams.get("active");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);

  const admin = createAdminClient();
  let query = admin
    .from("ritual_asset_mappings")
    .select(
      `*,
       asset:ritual_media_assets(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`,
      { count: "exact" }
    );

  if (scope === "global" || scope === "ritual_definition") {
    query = query.eq("mapping_scope", scope);
  }
  if (ritualDefinitionId) {
    query = query.eq("ritual_definition_id", ritualDefinitionId);
  }
  if (q_tag?.trim()) {
    query = query.ilike("tag_key", `%${q_tag.trim()}%`);
  }
  if (asset_id) {
    query = query.eq("asset_id", asset_id);
  }
  if (active === "true") {
    query = query.eq("is_active", true);
  } else if (active === "false") {
    query = query.eq("is_active", false);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("tag_key", { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}

/**
 * POST /api/admin/ritual-asset-mappings
 *
 * Required body:
 *   mapping_scope:        "global" | "ritual_definition"
 *   tag_key:              canonical tag string (e.g. "Fire_Gate_Invocation_Ritual")
 *   asset_id:             uuid of a ritual_media_assets row
 *   ritual_definition_id: required iff scope=ritual_definition; must be NULL for global
 *
 * The DB partial unique indexes prevent duplicate active mappings per
 * (scope, tag_key) — a duplicate POST returns 409.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const {
    mapping_scope,
    tag_key,
    asset_id,
    ritual_definition_id,
    label_override,
    sort_order,
    is_active,
  } = body;

  if (mapping_scope !== "global" && mapping_scope !== "ritual_definition") {
    return NextResponse.json(
      { error: "`mapping_scope` must be 'global' or 'ritual_definition'" },
      { status: 422 }
    );
  }
  if (typeof tag_key !== "string" || !tag_key.trim()) {
    return NextResponse.json({ error: "`tag_key` is required" }, { status: 422 });
  }
  if (typeof asset_id !== "string" || !asset_id) {
    return NextResponse.json({ error: "`asset_id` is required" }, { status: 422 });
  }
  if (
    mapping_scope === "ritual_definition" &&
    (typeof ritual_definition_id !== "string" || !ritual_definition_id)
  ) {
    return NextResponse.json(
      { error: "`ritual_definition_id` required for per-ritual mappings" },
      { status: 422 }
    );
  }
  if (mapping_scope === "global" && ritual_definition_id) {
    return NextResponse.json(
      { error: "Global mappings must not carry a ritual_definition_id" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_asset_mappings")
    .insert({
      mapping_scope,
      tag_key: tag_key.trim(),
      asset_id,
      ritual_definition_id:
        mapping_scope === "ritual_definition"
          ? (ritual_definition_id as string)
          : null,
      label_override: typeof label_override === "string" ? label_override : null,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) {
    // Postgres unique-violation surface
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "A mapping for that scope + tag already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
