import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/ritual-asset-mappings/:id
 *
 * Update an existing mapping row. Only the fields supplied in the body
 * are written. Common operations:
 *   - swap an asset:           { asset_id }
 *   - rename:                  { tag_key }
 *   - rewrite label:           { label_override }
 *   - toggle:                  { is_active: false }
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

  if (typeof body.tag_key === "string") update.tag_key = body.tag_key.trim();
  if (typeof body.asset_id === "string") update.asset_id = body.asset_id;
  if ("label_override" in body)
    update.label_override =
      typeof body.label_override === "string" ? body.label_override : null;
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ritual_asset_mappings")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "A mapping for that scope + tag already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/ritual-asset-mappings/:id
 *
 * Hard-delete. Mappings are cheap to recreate; we don't soft-archive.
 * The runtime resolver immediately falls back to the next layer
 * (per-ritual → global → code map).
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
    .from("ritual_asset_mappings")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
