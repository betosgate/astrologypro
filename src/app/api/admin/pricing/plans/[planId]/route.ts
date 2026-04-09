import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH  /api/admin/pricing/plans/[planId]  — update a plan
 * DELETE /api/admin/pricing/plans/[planId]  — hard delete a plan
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    const v = String(body.display_name).trim();
    if (!v) {
      return NextResponse.json({ error: "display_name cannot be empty" }, { status: 422 });
    }
    updates.display_name = v;
  }
  if (body.amount !== undefined) {
    const v = typeof body.amount === "number" ? body.amount : Number(body.amount);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 422 });
    }
    updates.amount = v;
  }
  if (body.mrp !== undefined) {
    if (body.mrp === null || body.mrp === "") {
      updates.mrp = null;
    } else {
      const v = typeof body.mrp === "number" ? body.mrp : Number(body.mrp);
      if (!Number.isFinite(v) || v < 0) {
        return NextResponse.json({ error: "mrp must be a non-negative number" }, { status: 422 });
      }
      updates.mrp = v;
    }
  }
  if (body.currency !== undefined) {
    if (body.currency !== "USD" && body.currency !== "INR") {
      return NextResponse.json({ error: "currency must be 'USD' or 'INR'" }, { status: 422 });
    }
    updates.currency = body.currency;
  }
  if (body.stripe_price_id !== undefined) {
    updates.stripe_price_id = body.stripe_price_id === null ? null : String(body.stripe_price_id).trim() || null;
  }
  if (body.stripe_price_name !== undefined) {
    updates.stripe_price_name = body.stripe_price_name === null ? null : String(body.stripe_price_name).trim() || null;
  }
  if (body.description !== undefined) {
    updates.description = body.description === null ? null : String(body.description).trim() || null;
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be boolean" }, { status: 422 });
    }
    updates.is_active = body.is_active;
  }
  if (body.sort_order !== undefined) {
    const v = typeof body.sort_order === "number" ? body.sort_order : Number(body.sort_order);
    if (!Number.isFinite(v)) {
      return NextResponse.json({ error: "sort_order must be a number" }, { status: 422 });
    }
    updates.sort_order = v;
  }
  if (body.custom_fields !== undefined) {
    if (!Array.isArray(body.custom_fields)) {
      return NextResponse.json({ error: "custom_fields must be an array" }, { status: 422 });
    }
    for (const f of body.custom_fields) {
      if (!f || typeof f !== "object" || !f.label || !f.value || !f.slug) {
        return NextResponse.json({ error: "Each custom field must have label, value, and slug" }, { status: 422 });
      }
    }
    updates.custom_fields = body.custom_fields;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pricing_plans")
    .update(updates)
    .eq("id", planId)
    .select()
    .single();

  if (error || !data) {
    if ((error as { code?: string } | null)?.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ plan: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { planId } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("pricing_plans").delete().eq("id", planId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
