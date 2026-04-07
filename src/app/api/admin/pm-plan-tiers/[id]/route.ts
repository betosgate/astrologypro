import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// ─── GET /api/admin/pm-plan-tiers/[id] ────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("pm_plan_tiers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// ─── PUT /api/admin/pm-plan-tiers/[id] ────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const {
    name,
    description,
    base_price_usd,
    base_member_limit,
    extra_per_member_usd,
    max_total_members,
    stripe_price_id,
    stripe_extra_price_id,
    display_order,
    is_active,
  } = body;

  // Validation
  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 422 });
  }
  if (base_price_usd !== undefined && (typeof base_price_usd !== "number" || base_price_usd < 0)) {
    return NextResponse.json(
      { error: "base_price_usd must be a non-negative number" },
      { status: 422 }
    );
  }
  if (
    base_member_limit !== undefined &&
    (typeof base_member_limit !== "number" ||
      !Number.isInteger(base_member_limit) ||
      base_member_limit < 1)
  ) {
    return NextResponse.json(
      { error: "base_member_limit must be an integer >= 1" },
      { status: 422 }
    );
  }
  if (
    extra_per_member_usd !== undefined &&
    (typeof extra_per_member_usd !== "number" || extra_per_member_usd < 0)
  ) {
    return NextResponse.json(
      { error: "extra_per_member_usd must be a non-negative number" },
      { status: 422 }
    );
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updatePayload.name = name.trim();
  if (description !== undefined) updatePayload.description = description;
  if (base_price_usd !== undefined) updatePayload.base_price_usd = base_price_usd;
  if (base_member_limit !== undefined) updatePayload.base_member_limit = base_member_limit;
  if (extra_per_member_usd !== undefined) updatePayload.extra_per_member_usd = extra_per_member_usd;
  if (max_total_members !== undefined) updatePayload.max_total_members = max_total_members;
  if (stripe_price_id !== undefined) updatePayload.stripe_price_id = stripe_price_id;
  if (stripe_extra_price_id !== undefined) updatePayload.stripe_extra_price_id = stripe_extra_price_id;
  if (display_order !== undefined) updatePayload.display_order = display_order;
  if (is_active !== undefined) updatePayload.is_active = is_active;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pm_plan_tiers")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── DELETE /api/admin/pm-plan-tiers/[id] ─────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  // Block delete if active members are on this tier
  const { count, error: countError } = await admin
    .from("community_members")
    .select("id", { count: "exact", head: true })
    .eq("pm_tier_id", id)
    .eq("membership_status", "active");

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete tier: ${count} active member(s) are on this tier. Move or cancel them first.`,
      },
      { status: 409 }
    );
  }

  const { error } = await admin.from("pm_plan_tiers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
