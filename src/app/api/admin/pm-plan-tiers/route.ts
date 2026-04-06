import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";


export const dynamic = "force-dynamic";

// ─── GET /api/admin/pm-plan-tiers ─────────────────────────────────────────────
// Lists all tiers with active member count per tier.

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data: tiers, error } = await admin
    .from("pm_plan_tiers")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach active member count for each tier
  const tiersWithCount = await Promise.all(
    (tiers ?? []).map(async (tier) => {
      const { count } = await admin
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("pm_tier_id", tier.id)
        .eq("membership_status", "active");

      return { ...tier, member_count: count ?? 0 };
    })
  );

  return NextResponse.json({ tiers: tiersWithCount });
}

// ─── POST /api/admin/pm-plan-tiers ────────────────────────────────────────────
// Creates a new tier.

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (typeof base_price_usd !== "number" || base_price_usd < 0) {
    return NextResponse.json(
      { error: "base_price_usd must be a non-negative number" },
      { status: 422 }
    );
  }
  if (
    typeof base_member_limit !== "number" ||
    !Number.isInteger(base_member_limit) ||
    base_member_limit < 1
  ) {
    return NextResponse.json(
      { error: "base_member_limit must be an integer >= 1" },
      { status: 422 }
    );
  }
  if (typeof extra_per_member_usd !== "number" || extra_per_member_usd < 0) {
    return NextResponse.json(
      { error: "extra_per_member_usd must be a non-negative number" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pm_plan_tiers")
    .insert({
      name: name.trim(),
      description: description ?? null,
      base_price_usd,
      base_member_limit,
      extra_per_member_usd: extra_per_member_usd ?? 0,
      max_total_members: max_total_members ?? 10,
      stripe_price_id: stripe_price_id ?? null,
      stripe_extra_price_id: stripe_extra_price_id ?? null,
      display_order: display_order ?? 0,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
