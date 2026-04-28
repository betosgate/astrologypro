import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ritual-configurations/:id
 *
 * Fetch a single ritual_definitions row plus its linked final-override
 * asset and every per-ritual mapping (for the editor's Mappings tab).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: definition, error } = await admin
    .from("ritual_definitions")
    .select(
      `*,
       final_override_asset:ritual_media_assets(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!definition)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: mappings } = await admin
    .from("ritual_asset_mappings")
    .select(
      `*,
       asset:ritual_media_assets(id, asset_key, title, source_type, storage_path, external_url, is_active, is_published)`
    )
    .eq("mapping_scope", "ritual_definition")
    .eq("ritual_definition_id", id)
    .order("tag_key", { ascending: true });

  return NextResponse.json({ definition, mappings: mappings ?? [] });
}

/**
 * PATCH /api/admin/ritual-configurations/:id
 *
 * Partial update. Only the fields supplied in the body are written;
 * everything else is preserved. The endpoint accepts every column on
 * ritual_definitions that the editor surfaces, with the same value
 * coercion as the create route.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const admin = createAdminClient();

  const update: Record<string, unknown> = {};
  if (typeof body.key === "string") update.key = body.key.trim();
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.description === "string" || body.description === null)
    update.description = body.description;
  if (body.ritual_type === "static" || body.ritual_type === "dynamic")
    update.ritual_type = body.ritual_type;
  if (
    body.supported_mode === "invocation" ||
    body.supported_mode === "banishing" ||
    body.supported_mode === "both"
  )
    update.supported_mode = body.supported_mode;
  if (typeof body.badge_label === "string" || body.badge_label === null)
    update.badge_label = body.badge_label;
  if (typeof body.icon_key === "string" || body.icon_key === null)
    update.icon_key = body.icon_key;
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;
  if (typeof body.is_visible === "boolean") update.is_visible = body.is_visible;
  if (typeof body.is_published === "boolean")
    update.is_published = body.is_published;
  if (body.playback_policy_json && typeof body.playback_policy_json === "object")
    update.playback_policy_json = body.playback_policy_json;
  if (typeof body.final_override_enabled === "boolean")
    update.final_override_enabled = body.final_override_enabled;
  if ("final_override_asset_id" in body) {
    update.final_override_asset_id =
      typeof body.final_override_asset_id === "string" &&
      body.final_override_asset_id.trim()
        ? body.final_override_asset_id
        : null;
  }
  for (const k of [
    "card_title_override",
    "card_description_override",
    "card_cta_label_override",
    "playlist_title_override",
    "completion_message",
    "missing_asset_message",
  ]) {
    if (k in body) {
      update[k] = typeof body[k] === "string" ? body[k] : null;
    }
  }
  if (body.archive === true) {
    update.archived_at = new Date().toISOString();
  }
  if (body.unarchive === true) {
    update.archived_at = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("ritual_definitions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
