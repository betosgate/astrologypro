import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * GET /api/community/plan
 *
 * Returns plan details for the authenticated PM member.
 *
 * Reads the member's real saved tier from community_members.pm_tier_id
 * and matches it against active pm_plan_tiers. Falls back to the
 * lowest-order active tier only when pm_tier_id is NULL or does not
 * match any active tier (a warning is logged in that case).
 *
 * Field names in the response are aligned with the Plan / PlanTier
 * TypeScript types used by the page component:
 *   tier.base_price         ← pm_plan_tiers.base_price_usd
 *   tier.included_members   ← pm_plan_tiers.base_member_limit
 *   tier.extra_member_price ← pm_plan_tiers.extra_per_member_usd
 *   plan.member_count       ← family_members.length
 *   plan.extra_member_count ← max(0, member_count - tier.included_members)
 *   plan.extra_member_charge← extra_member_count × tier.extra_member_price
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

    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         membership_status,
         current_period_end,
         stripe_subscription_id,
         extra_member_count,
         pm_tier_id`
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
    const [{ data: familyMembers, error: familyError }, { data: rawTiers }] =
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

    // Map DB column names → page TypeScript type field names
    type RawTier = {
      id: string;
      name: string;
      description: string;
      base_price_usd: number;
      base_member_limit: number;
      extra_per_member_usd: number;
      max_total_members: number;
    };
    type MappedTier = {
      id: string;
      name: string;
      description: string;
      base_price: number;
      included_members: number;
      extra_member_price: number;
      max_total_members: number;
    };

    const mapTier = (t: RawTier): MappedTier => ({
      id: t.id,
      name: t.name,
      description: t.description,
      base_price: Number(t.base_price_usd),
      included_members: t.base_member_limit,
      extra_member_price: Number(t.extra_per_member_usd),
      max_total_members: t.max_total_members,
    });

    const availableTiers: MappedTier[] = (rawTiers ?? []).map(
      (t) => mapTier(t as RawTier)
    );

    // Resolve the member's current tier from pm_tier_id. Fall back to the
    // lowest-order active tier only when pm_tier_id is NULL or invalid.
    const savedTierId = (member as { pm_tier_id?: string | null }).pm_tier_id ?? null;
    let tier: MappedTier | null = null;
    if (savedTierId) {
      tier = availableTiers.find((t) => t.id === savedTierId) ?? null;
      if (!tier) {
        console.warn(
          `[community/plan] pm_tier_id=${savedTierId} for member ${member.id} does not match any active tier — falling back to lowest-order tier`
        );
      }
    }
    if (!tier) tier = availableTiers[0] ?? null;

    const memberCount = (familyMembers ?? []).length;
    const extraMemberCount = tier
      ? Math.max(0, memberCount - tier.included_members)
      : 0;
    const extraMemberCharge = tier
      ? Number((extraMemberCount * tier.extra_member_price).toFixed(2))
      : 0;
    const totalMonthly = tier
      ? Number((tier.base_price + extraMemberCharge).toFixed(2))
      : 0;

    return NextResponse.json({
      plan: {
        tier,
        available_tiers: availableTiers,
        member_count: memberCount,
        extra_member_count: extraMemberCount,
        extra_member_charge: extraMemberCharge,
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
