import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/community/plan
 *
 * Returns the full plan details for the authenticated Perennial Mandalism member,
 * including tier info, family members, and the calculated monthly charge breakdown.
 *
 * Response shape:
 * {
 *   plan: {
 *     tier: { id, name, description, base_price_usd, base_member_limit,
 *              extra_per_member_usd, max_total_members },
 *     current_members: number,
 *     extra_members: number,
 *     base_charge: number,
 *     extra_charge: number,
 *     total_monthly: number,
 *     membership_status: string,
 *     current_period_end: string | null,
 *     stripe_subscription_id: string | null,
 *     family_members: Array<{ id, full_name, relationship, age_group, date_of_birth }>
 *   }
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch community_members row joined with pm_plan_tiers
    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         membership_status,
         current_period_end,
         stripe_subscription_id,
         extra_member_count,
         pm_plan_tiers (
           id,
           name,
           description,
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

    // Fetch family members
    const { data: familyMembers, error: familyError } = await admin
      .from("community_family_members")
      .select("id, full_name, relationship, age_group, date_of_birth")
      .eq("member_id", member.id)
      .order("created_at", { ascending: true });

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    type TierShape = {
      id: string;
      name: string;
      description: string;
      base_price_usd: number;
      base_member_limit: number;
      extra_per_member_usd: number;
      max_total_members: number;
    };
    const rawTier = member.pm_plan_tiers;
    const tier: TierShape | null = Array.isArray(rawTier)
      ? (rawTier[0] as TierShape) ?? null
      : (rawTier as unknown as TierShape | null);

    const currentMembers = (familyMembers ?? []).length;
    const extraMembers = tier
      ? Math.max(0, currentMembers - tier.base_member_limit)
      : 0;
    const baseCharge = tier ? Number(tier.base_price_usd) : 0;
    const extraCharge = tier
      ? Number((extraMembers * Number(tier.extra_per_member_usd)).toFixed(2))
      : 0;
    const totalMonthly = Number((baseCharge + extraCharge).toFixed(2));

    return NextResponse.json({
      plan: {
        tier,
        current_members: currentMembers,
        extra_members: extraMembers,
        base_charge: baseCharge,
        extra_charge: extraCharge,
        total_monthly: totalMonthly,
        membership_status: member.membership_status,
        current_period_end: member.current_period_end ?? null,
        stripe_subscription_id: member.stripe_subscription_id ?? null,
        family_members: familyMembers ?? [],
      },
    });
  } catch (err) {
    console.error("[community/plan] GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve plan details" },
      { status: 500 }
    );
  }
}
