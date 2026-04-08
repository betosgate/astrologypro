import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH  /api/admin/pricing/[id]   — update price / item_name / currency / is_active / description
 * DELETE /api/admin/pricing/[id]   — hard delete (rare; usually you'd toggle is_active)
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
  if (body.price !== undefined) {
    const v = typeof body.price === "number" ? body.price : Number(body.price);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json(
        { error: "price must be a non-negative number" },
        { status: 422 },
      );
    }
    updates.price = v;
  }
  if (body.currency !== undefined) {
    if (body.currency !== "USD" && body.currency !== "INR") {
      return NextResponse.json(
        { error: "currency must be 'USD' or 'INR'" },
        { status: 422 },
      );
    }
    updates.currency = body.currency;
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
