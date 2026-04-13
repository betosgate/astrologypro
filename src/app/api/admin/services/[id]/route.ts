import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/services/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  return NextResponse.json({ service: data });
}

/**
 * PUT /api/admin/services/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim();
    update.slug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  if (typeof body.diviner_id === "string") update.diviner_id = body.diviner_id;
  if (typeof body.category === "string") update.category = body.category;
  if (typeof body.description === "string") update.description = body.description.trim();
  if (typeof body.duration_minutes === "number") update.duration_minutes = body.duration_minutes;
  if (typeof body.base_price === "number") update.base_price = body.base_price;
  if (typeof body.overage_rate === "number") update.overage_rate = body.overage_rate;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;
  if (typeof body.is_featured === "boolean") update.is_featured = body.is_featured;
  if (typeof body.is_primary === "boolean") update.is_primary = body.is_primary;
  if (typeof body.requires_birth_data === "boolean") update.requires_birth_data = body.requires_birth_data;
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;
  if (typeof body.pricing_item_key === "string") update.pricing_item_key = body.pricing_item_key.trim() || null;
  if (body.pricing_item_key === null) update.pricing_item_key = null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("services")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  return NextResponse.json({ service: data });
}

/**
 * DELETE /api/admin/services/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
