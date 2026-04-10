import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH  /api/admin/pricing/[id]   — update item_name / is_active / description
 * DELETE /api/admin/pricing/[id]   — hard delete (rare; usually you'd toggle is_active)
 * Note: price/currency live on pricing_plans, not on the item.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 422 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.item_name !== undefined) {
    const v = String(body.item_name).trim();
    if (!v) {
      return NextResponse.json({ error: "item_name cannot be empty" }, { status: 422 });
    }
    updates.item_name = v;
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be boolean" }, { status: 422 });
    }
    updates.is_active = body.is_active;
  }
  if (body.description !== undefined) {
    updates.description =
      body.description === null
        ? null
        : String(body.description).trim() || null;
  }
  if (body.stripe_product_id !== undefined) {
    updates.stripe_product_id = body.stripe_product_id === null ? null : String(body.stripe_product_id).trim() || null;
  }
  if (body.stripe_product_name !== undefined) {
    updates.stripe_product_name = body.stripe_product_name === null ? null : String(body.stripe_product_name).trim() || null;
  }
  if (body.payment_provider !== undefined) {
    updates.payment_provider = body.payment_provider === null ? null : String(body.payment_provider).trim() || null;
  }
  if (body.payment_provider_id !== undefined) {
    updates.payment_provider_id = body.payment_provider_id === null ? null : String(body.payment_provider_id).trim() || null;
  }
  if (body.html_description !== undefined) {
    updates.html_description = body.html_description === null ? null : String(body.html_description) || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("global_pricing")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    if ((error as { code?: string } | null)?.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("global_pricing").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
