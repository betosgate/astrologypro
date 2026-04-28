import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ritual-configurations
 *
 * List every ritual_definitions row, plus the linked final-override
 * asset (when one is set) so the index can show "ready / no asset"
 * without a second round-trip per row. Admin-only.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  const type = req.nextUrl.searchParams.get("type");
  const status = req.nextUrl.searchParams.get("status");
  const override = req.nextUrl.searchParams.get("override");

  const admin = createAdminClient();
  let query = admin
    .from("ritual_definitions")
    .select(
      `*,
       final_override_asset:ritual_media_assets(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
    )
    .is("archived_at", null);

  if (q?.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,key.ilike.%${q.trim()}%`);
  }
  if (type && type !== "all") {
    query = query.eq("ritual_type", type);
  }
  if (status === "published") {
    query = query.eq("is_published", true);
  } else if (status === "draft") {
    query = query.eq("is_published", false);
  }
  if (override === "on") {
    query = query.eq("final_override_enabled", true);
  } else if (override === "off") {
    query = query.eq("final_override_enabled", false);
  }

  const { data, error } = await query.order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/**
 * POST /api/admin/ritual-configurations
 *
 * Create a new ritual_definitions row. Required: key + title.
 * Everything else has sensible defaults set on the column or by the
 * client form.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    key,
    title,
    description,
    ritual_type,
    supported_mode,
    badge_label,
    icon_key,
    sort_order,
    is_visible,
    is_published,
    playback_policy_json,
    final_override_enabled,
    final_override_asset_id,
    card_title_override,
    card_description_override,
    card_cta_label_override,
    playlist_title_override,
    completion_message,
    missing_asset_message,
  } = body as Record<string, unknown>;

  if (typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "`key` is required" }, { status: 422 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "`title` is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_definitions")
    .insert({
      key: key.trim(),
      title: title.trim(),
      description: typeof description === "string" ? description : null,
      ritual_type:
        ritual_type === "static" || ritual_type === "dynamic"
          ? ritual_type
          : "dynamic",
      supported_mode:
        supported_mode === "invocation" ||
        supported_mode === "banishing" ||
        supported_mode === "both"
          ? supported_mode
          : "both",
      badge_label: typeof badge_label === "string" ? badge_label : null,
      icon_key: typeof icon_key === "string" ? icon_key : null,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      is_visible: is_visible !== false,
      is_published: is_published !== false,
      ...(playback_policy_json && typeof playback_policy_json === "object"
        ? { playback_policy_json }
        : {}),
      final_override_enabled: final_override_enabled === true,
      final_override_asset_id:
        typeof final_override_asset_id === "string" && final_override_asset_id
          ? final_override_asset_id
          : null,
      card_title_override:
        typeof card_title_override === "string" ? card_title_override : null,
      card_description_override:
        typeof card_description_override === "string"
          ? card_description_override
          : null,
      card_cta_label_override:
        typeof card_cta_label_override === "string"
          ? card_cta_label_override
          : null,
      playlist_title_override:
        typeof playlist_title_override === "string"
          ? playlist_title_override
          : null,
      completion_message:
        typeof completion_message === "string" ? completion_message : null,
      missing_asset_message:
        typeof missing_asset_message === "string"
          ? missing_asset_message
          : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
