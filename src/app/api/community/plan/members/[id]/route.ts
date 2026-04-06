import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateStripeExtraSeats } from "@/lib/stripe/plan-seats";

export const runtime = "nodejs";

/**
 * DELETE /api/community/plan/members/:id
 *
 * Removes a family member from the authenticated PM member's plan and
 * reconciles Stripe extra-seat billing if the extra_member_count decreases.
 *
 * Response: { success: true, new_total_monthly: number }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: familyMemberId } = await params;

    const admin = createAdminClient();

    // Fetch member row with tier details
    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         stripe_subscription_id,
         extra_member_count,
         pm_plan_tiers (
           id,
           base_price_usd,
           base_member_limit,
           extra_per_member_usd,
           stripe_extra_price_id
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

    // Verify ownership — the family member row must belong to this member
    const { data: familyMember, error: ownershipError } = await admin
      .from("community_family_members")
      .select("id")
      .eq("id", familyMemberId)
      .eq("member_id", member.id)
      .single();

    if (ownershipError || !familyMember) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Delete the family member row
    const { error: deleteError } = await admin
      .from("community_family_members")
      .delete()
      .eq("id", familyMemberId)
      .eq("member_id", member.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Count remaining family members
    const { count: remainingCount } = await admin
      .from("community_family_members")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id);

    const newCount = remainingCount ?? 0;

    type TierShape = {
      id: string;
      base_price_usd: number;
      base_member_limit: number;
      extra_per_member_usd: number;
      stripe_extra_price_id: string | null;
    };
    const rawTier = member.pm_plan_tiers;
    const tier: TierShape | null = Array.isArray(rawTier)
      ? (rawTier[0] as TierShape) ?? null
      : (rawTier as unknown as TierShape | null);

    const newExtraCount = tier
      ? Math.max(0, newCount - tier.base_member_limit)
      : 0;
    const prevExtraCount = member.extra_member_count ?? 0;

    // Update Stripe extra-seat quantity if it changed
    if (
      tier &&
      newExtraCount !== prevExtraCount &&
      member.stripe_subscription_id &&
      tier.stripe_extra_price_id
    ) {
      await updateStripeExtraSeats(
        member.stripe_subscription_id,
        tier.stripe_extra_price_id,
        newExtraCount
      );
    }

    // Update community_members.extra_member_count
    await admin
      .from("community_members")
      .update({ extra_member_count: newExtraCount })
      .eq("id", member.id);

    const baseCharge = tier ? Number(tier.base_price_usd) : 0;
    const extraCharge = tier
      ? Number((newExtraCount * Number(tier.extra_per_member_usd)).toFixed(2))
      : 0;
    const newTotalMonthly = Number((baseCharge + extraCharge).toFixed(2));

    return NextResponse.json({ success: true, new_total_monthly: newTotalMonthly });
  } catch (err) {
    console.error("[community/plan/members/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove family member" },
      { status: 500 }
    );
  }
}
