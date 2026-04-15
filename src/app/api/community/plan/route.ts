import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * GET /api/community/plan
 *
 * Returns the full plan details for the authenticated Perennial Mandalism member,
 * including tier info, family members, and the calculated monthly charge breakdown.
 *
 * Note: community_members has no FK to pm_plan_tiers. We default to the
 * lowest-order active tier (Individual) for all members until the FK is added.
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

    // Fetch community_members row (no FK join — plan_tier_id column doesn't exist yet)
    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         membership_status,
         current_period_end,
         stripe_subscription_id,
         extra_member_count`
      )
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    // Fetch family members + available tiers in parallel
    const [{ data: familyMembers, error: familyError }, { data: tiers }] =
      await Promise.all([
        admin
          .from("community_family_members")
          .select("id, full_name, relationship, age_group, date_of_birth")
          .eq("member_id", member.id)
          .order("created_at", { ascending: true }),
        admin
          .from("pm_plan_tiers")
          .select(
            "id, name, description, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members"
          )
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);

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

    // Default to first (lowest-order) active tier — Individual
    const tier: TierShape | null = (tiers?.[0] as TierShape) ?? null;

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
        available_tiers: tiers ?? [],
        current_members: currentMembers,
        extra_members: extraMembers,
        base_charge: baseCharge,
        extra_charge: extraCharge,
        total_monthly: totalMonthly,
        status: member.membership_status,
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
