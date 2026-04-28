import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/ritual-assets/:id
 *
 * Partial update. Same coercion rules as POST. Common usage:
 *   { is_active: false }      // soft-disable an asset
 *   { is_published: false }   // unpublish (keep editable)
 *   { external_url: "..." }   // rotate the URL
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (typeof body.asset_key === "string") update.asset_key = body.asset_key.trim();
  if (typeof body.title === "string") update.title = body.title.trim();
  if (body.source_type === "upload" || body.source_type === "external_url")
    update.source_type = body.source_type;
  if ("storage_path" in body)
    update.storage_path =
      typeof body.storage_path === "string" ? body.storage_path : null;
  if ("external_url" in body)
    update.external_url =
      typeof body.external_url === "string" ? body.external_url : null;
  if (typeof body.mime_type === "string") update.mime_type = body.mime_type;
  if (typeof body.duration_seconds === "number")
    update.duration_seconds = body.duration_seconds;
  if ("poster_url" in body)
    update.poster_url =
      typeof body.poster_url === "string" ? body.poster_url : null;
  if ("notes" in body)
    update.notes = typeof body.notes === "string" ? body.notes : null;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;
  if (typeof body.is_published === "boolean")
    update.is_published = body.is_published;
  if (body.archive === true) update.archived_at = new Date().toISOString();
  if (body.unarchive === true) update.archived_at = null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_media_assets")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/ritual-assets/:id
 *
 * Soft-archive. We never hard-delete media rows because mappings and
 * final-override links FK to them; archiving sets archived_at and the
 * runtime resolver already filters archived rows out of read paths.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("ritual_media_assets")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ archived: true });
}
