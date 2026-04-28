import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ritual-assets
 *
 * List every asset row plus a usage count derived from active mappings
 * + final-override links so the asset library can show "in use here".
 * Admin-only.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const state = searchParams.get("state");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const sort = searchParams.get("sort") ?? "desc";

  const admin = createAdminClient();
  let query = admin.from("ritual_media_assets").select("*", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,asset_key.ilike.%${search}%`);
  }

  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (state === "published") {
    query = query.eq("is_published", true).is("archived_at", null);
  } else if (state === "draft") {
    query = query.eq("is_published", false).is("archived_at", null);
  } else if (state === "archived") {
    query = query.not("archived_at", "is", null);
  } else {
    // By default, exclude archived if not explicitly requested
    query = query.is("archived_at", null);
  }

  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }
  if (toDate) {
    query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: assets, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mapping usage count per asset.
  const { data: mappings } = await admin
    .from("ritual_asset_mappings")
    .select("asset_id")
    .eq("is_active", true);
  const mappingCounts = new Map<string, number>();
  for (const m of mappings ?? []) {
    mappingCounts.set(m.asset_id, (mappingCounts.get(m.asset_id) ?? 0) + 1);
  }

  // Final-override usage count.
  const { data: overrideRefs } = await admin
    .from("ritual_definitions")
    .select("final_override_asset_id")
    .not("final_override_asset_id", "is", null);
  const overrideCounts = new Map<string, number>();
  for (const r of overrideRefs ?? []) {
    if (!r.final_override_asset_id) continue;
    overrideCounts.set(
      r.final_override_asset_id,
      (overrideCounts.get(r.final_override_asset_id) ?? 0) + 1
    );
  }

  const enriched = (assets ?? []).map((a) => ({
    ...a,
    mapping_count: mappingCounts.get(a.id) ?? 0,
    final_override_count: overrideCounts.get(a.id) ?? 0,
  }));

  return NextResponse.json({
    items: enriched,
    total: count ?? 0,
    page,
    pageSize,
  });
}

/**
 * POST /api/admin/ritual-assets
 *
 * Create an asset row. For URL-based assets the body is JSON. For
 * uploads the client should hit /api/admin/ritual-assets/upload first
 * (multipart) then POST here with `source_type: "upload"` + the
 * returned `storage_path`.
 *
 * Body fields:
 *   asset_key (required, unique)
 *   title (required)
 *   source_type ("upload" | "external_url")
 *   storage_path (required when source_type=upload)
 *   external_url (required when source_type=external_url)
 *   mime_type, duration_seconds, poster_url, notes, is_active, is_published
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const {
    asset_key,
    title,
    source_type,
    storage_path,
    external_url,
    mime_type,
    duration_seconds,
    poster_url,
    notes,
    is_active,
    is_published,
  } = body;

  if (typeof asset_key !== "string" || !asset_key.trim()) {
    return NextResponse.json({ error: "`asset_key` is required" }, { status: 422 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "`title` is required" }, { status: 422 });
  }
  if (source_type !== "upload" && source_type !== "external_url") {
    return NextResponse.json(
      { error: "`source_type` must be 'upload' or 'external_url'" },
      { status: 422 }
    );
  }
  if (
    source_type === "upload" &&
    (typeof storage_path !== "string" || !storage_path)
  ) {
    return NextResponse.json(
      { error: "`storage_path` is required for uploads" },
      { status: 422 }
    );
  }
  if (
    source_type === "external_url" &&
    (typeof external_url !== "string" || !external_url)
  ) {
    return NextResponse.json(
      { error: "`external_url` is required for external_url assets" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_media_assets")
    .insert({
      asset_key: asset_key.trim(),
      title: title.trim(),
      source_type,
      storage_path:
        source_type === "upload" ? (storage_path as string) : null,
      external_url:
        source_type === "external_url" ? (external_url as string) : null,
      mime_type: typeof mime_type === "string" ? mime_type : "video/mp4",
      duration_seconds:
        typeof duration_seconds === "number" ? duration_seconds : null,
      poster_url: typeof poster_url === "string" ? poster_url : null,
      notes: typeof notes === "string" ? notes : null,
      is_active: is_active !== false,
      is_published: is_published !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
