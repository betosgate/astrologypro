import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { updateStripeExtraSeats } from "@/lib/stripe/plan-seats";

export const runtime = "nodejs";

/**
 * POST /api/community/plan/change-tier
 *
 * Upgrades or downgrades the authenticated PM member to a different tier.
 * Body: { tier_id: string }
 *
 * If a Stripe subscription exists, updates the subscription in Stripe using
 * proration_behavior: 'create_prorations'. The old base price item is swapped
 * for the new tier's stripe_price_id, and extra-seat quantity is reconciled.
 *
 * If no Stripe subscription exists (manual billing), only the DB row is updated.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier_id } = body as { tier_id?: string };

    if (!tier_id) {
      return NextResponse.json(
        { error: "tier_id is required" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    // Fetch current member row with current tier
    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         stripe_subscription_id,
         extra_member_count,
         pm_tier_id,
         pm_plan_tiers (
           id,
           stripe_price_id,
           stripe_extra_price_id,
           base_member_limit
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

    // Validate new tier exists and is active
    const { data: newTier, error: tierError } = await admin
      .from("pm_plan_tiers")
      .select(
        "id, name, description, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members, stripe_price_id, stripe_extra_price_id"
      )
      .eq("id", tier_id)
      .eq("is_active", true)
      .single();

    if (tierError || !newTier) {
      return NextResponse.json(
        { error: "Tier not found or inactive" },
        { status: 404 }
      );
    }

    // Count current family members for extra-seat recalculation
    const { count: familyCount } = await admin
      .from("community_family_members")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id);

    const newExtraCount = Math.max(
      0,
      (familyCount ?? 0) - newTier.base_member_limit
    );

    // Update Stripe subscription if one exists
    if (member.stripe_subscription_id && newTier.stripe_price_id) {
      const subscription = await stripe.subscriptions.retrieve(
        member.stripe_subscription_id,
        { expand: ["items"] }
      );

      const currentTier = member.pm_plan_tiers as {
        id: string;
        stripe_price_id: string | null;
        stripe_extra_price_id: string | null;
        base_member_limit: number;
      } | null;

      const oldPriceId = currentTier?.stripe_price_id;
      const oldItem = oldPriceId
        ? subscription.items.data.find((item) => item.price.id === oldPriceId)
        : null;

      if (oldItem) {
        // Swap old base price item to new tier price
        await stripe.subscriptionItems.update(oldItem.id, {
          price: newTier.stripe_price_id,
          quantity: 1,
          proration_behavior: "create_prorations",
        });
      } else {
        // Old item not found — add new base price item
        await stripe.subscriptionItems.create({
          subscription: member.stripe_subscription_id,
          price: newTier.stripe_price_id,
          quantity: 1,
          proration_behavior: "create_prorations",
        });
      }

      // Reconcile extra seats on new tier
      if (newTier.stripe_extra_price_id) {
        await updateStripeExtraSeats(
          member.stripe_subscription_id,
          newTier.stripe_extra_price_id,
          newExtraCount
        );
      }
    }

    // Update community_members row
    const { error: updateError } = await admin
      .from("community_members")
      .update({
        pm_tier_id: tier_id,
        extra_member_count: newExtraCount,
      })
      .eq("id", member.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Return updated plan summary
    const baseCharge = Number(newTier.base_price_usd);
    const extraCharge = Number(
      (newExtraCount * Number(newTier.extra_per_member_usd)).toFixed(2)
    );
    const totalMonthly = Number((baseCharge + extraCharge).toFixed(2));

    return NextResponse.json({
      plan: {
        tier: {
          id: newTier.id,
          name: newTier.name,
          description: newTier.description,
          base_price_usd: newTier.base_price_usd,
          base_member_limit: newTier.base_member_limit,
          extra_per_member_usd: newTier.extra_per_member_usd,
          max_total_members: newTier.max_total_members,
        },
        extra_members: newExtraCount,
        base_charge: baseCharge,
        extra_charge: extraCharge,
        total_monthly: totalMonthly,
      },
    });
  } catch (err) {
    console.error("[community/plan/change-tier] POST error:", err);
    return NextResponse.json(
      { error: "Failed to change plan tier" },
      { status: 500 }
    );
  }
}
