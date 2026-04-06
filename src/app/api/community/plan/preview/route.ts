import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/community/plan/preview?members=5
 *
 * Returns a pricing breakdown for a given member count against the
 * authenticated PM member's current tier. Useful for showing cost
 * impact before adding or removing members.
 *
 * Query params: members (integer, required)
 *
 * Response shape:
 * {
 *   member_count: number,
 *   tier: { name, base_member_limit, base_price_usd, extra_per_member_usd },
 *   breakdown: {
 *     base_charge: number,
 *     extra_members: number,
 *     extra_charge: number,
 *     total_monthly: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const membersParam = searchParams.get("members");

    if (!membersParam) {
      return NextResponse.json(
        { error: "Query param 'members' is required" },
        { status: 422 }
      );
    }

    const memberCount = parseInt(membersParam, 10);

    if (isNaN(memberCount) || memberCount < 0) {
      return NextResponse.json(
        { error: "'members' must be a non-negative integer" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    // Fetch member row with tier
    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         pm_plan_tiers (
           name,
           base_price_usd,
           base_member_limit,
           extra_per_member_usd,
           max_total_members
         )`
      )
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    type TierShape = {
      name: string;
      base_price_usd: number;
      base_member_limit: number;
      extra_per_member_usd: number;
      max_total_members: number;
    };
    const rawTier = member.pm_plan_tiers;
    const tier: TierShape | null = Array.isArray(rawTier)
      ? (rawTier[0] as TierShape) ?? null
      : (rawTier as unknown as TierShape | null);

    if (!tier) {
      return NextResponse.json(
        { error: "No plan tier configured for this membership" },
        { status: 404 }
      );
    }

    const extraMembers = Math.max(0, memberCount - tier.base_member_limit);
    const baseCharge = Number(tier.base_price_usd);
    const extraCharge = Number(
      (extraMembers * Number(tier.extra_per_member_usd)).toFixed(2)
    );
    const totalMonthly = Number((baseCharge + extraCharge).toFixed(2));

    return NextResponse.json({
      member_count: memberCount,
      tier: {
        name: tier.name,
        base_member_limit: tier.base_member_limit,
        base_price_usd: tier.base_price_usd,
        extra_per_member_usd: tier.extra_per_member_usd,
      },
      breakdown: {
        base_charge: baseCharge,
        extra_members: extraMembers,
        extra_charge: extraCharge,
        total_monthly: totalMonthly,
      },
    });
  } catch (err) {
    console.error("[community/plan/preview] GET error:", err);
    return NextResponse.json(
      { error: "Failed to generate plan preview" },
      { status: 500 }
    );
  }
}
