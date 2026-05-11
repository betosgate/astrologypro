/**
 * POST /api/community/plan/change-tier/confirm
 *
 * Finalizes a tier upgrade for an ACTIVE recurring subscriber.
 * Call this only after the user confirms the prorated preview.
 *
 * Body: { target_tier_id: string }
 *
 * Flow:
 *   1. Verify member and active Stripe subscription.
 *   2. Swap the base-price subscription item to the target tier's
 *      stripe_price_id with proration_behavior: "always_invoice" so
 *      Stripe charges the prorated difference immediately.
 *   3. Reconcile extra-seat quantity on the new tier.
 *   4. Only after Stripe returns success → update community_members.pm_tier_id
 *      and extra_member_count.
 *
 * Stripe payment failures leave pm_tier_id unchanged. All errors are
 * logged with subscription/customer context for manual reconciliation.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { updateStripeExtraSeats } from "@/lib/stripe/plan-seats";
import { tierToPlanType } from "@/lib/community/pm-entitlement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ACTIVE_SUB_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      target_tier_id?: string;
    };
    const targetTierId = body.target_tier_id;
    if (!targetTierId) {
      return NextResponse.json(
        { error: "target_tier_id is required" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    const { data: member, error: memberErr } = await admin
      .from("community_members")
      .select(
        `id,
         stripe_subscription_id,
         pm_tier_id,
         pm_plan_tiers (
           id, stripe_price_id, stripe_extra_price_id, base_member_limit
         )`
      )
      .eq("user_id", user.id)
      .single();
    if (memberErr || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (!member.stripe_subscription_id) {
      return NextResponse.json(
        {
          error:
            "No active subscription found. Use /change-tier/checkout to start a recurring subscription instead.",
        },
        { status: 409 }
      );
    }

    // Validate target tier
    let targetTier;
    if (targetTierId === "plan_pm_individual") {
      targetTier = {
        id: "plan_pm_individual",
        name: "Individual Plan",
        base_price_usd: 19.95,
        base_member_limit: 1,
        stripe_price_id: "price_1RtmCrBcRXKECv5fhg6KUun3",
        is_active: true,
        max_total_members: 1,
      };
    } else if (targetTierId === "plan_pm_couple") {
      targetTier = {
        id: "plan_pm_couple",
        name: "Couple Plan",
        base_price_usd: 29.95,
        base_member_limit: 2,
        stripe_price_id: "price_1RtmCKBcRXKECv5fCP1Radka",
        is_active: true,
        max_total_members: 2,
      };
    } else if (targetTierId === "plan_pm_family") {
      targetTier = {
        id: "plan_pm_family",
        name: "Family Plan",
        base_price_usd: 39.95,
        base_member_limit: 5,
        stripe_price_id: "price_1RtmBbBcRXKECv5fun9Xjjwi",
        is_active: true,
        max_total_members: 5,
      };
    } else {
      const { data, error: tierErr } = await admin
        .from("pm_plan_tiers")
        .select(
          "id, name, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members, stripe_price_id, stripe_extra_price_id, is_active"
        )
        .eq("id", targetTierId)
        .single();

      if (tierErr || !data) {
        return NextResponse.json(
          { error: "Target tier not found" },
          { status: 404 }
        );
      }
      targetTier = data;
    }
    if (!targetTier.is_active) {
      return NextResponse.json(
        { error: "Target tier is not active" },
        { status: 422 }
      );
    }
    if (!targetTier.stripe_price_id) {
      return NextResponse.json(
        { error: "Target tier has no recurring Stripe price configured" },
        { status: 422 }
      );
    }

    // Verify subscription is active
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(
        member.stripe_subscription_id
      );
    } catch (err) {
      console.error("[change-tier/confirm] Stripe retrieve failed", {
        subscription_id: member.stripe_subscription_id,
        user_id: user.id,
        err,
      });
      return NextResponse.json(
        { error: "Subscription not found on Stripe" },
        { status: 404 }
      );
    }

    if (!ACTIVE_SUB_STATUSES.includes(subscription.status)) {
      return NextResponse.json(
        {
          error: `Subscription is ${subscription.status}; cannot upgrade via proration. Please use the checkout flow.`,
          subscription_status: subscription.status,
        },
        { status: 409 }
      );
    }

    // Household over the new tier's hard ceiling → block to prevent capacity
    // issues after downgrade-like changes.
    const { count: familyCount } = await admin
      .from("community_family_members")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id);
    const currentFamilyCount = familyCount ?? 0;

    if (
      targetTier.max_total_members != null &&
      currentFamilyCount > targetTier.max_total_members
    ) {
      return NextResponse.json(
        {
          error: `This tier supports up to ${targetTier.max_total_members} household members, but you currently have ${currentFamilyCount}.`,
        },
        { status: 422 }
      );
    }

    const newExtraCount = Math.max(
      0,
      currentFamilyCount - targetTier.base_member_limit
    );

    // Find the base-price item to swap. Prefer matching by the saved current
    // tier's stripe_price_id; fall back to the first item.
    const rawCurrentTier = member.pm_plan_tiers as
      | { stripe_price_id?: string | null }
      | { stripe_price_id?: string | null }[]
      | null;
    const currentTier = Array.isArray(rawCurrentTier)
      ? rawCurrentTier[0] ?? null
      : rawCurrentTier;
    const oldPriceId = currentTier?.stripe_price_id ?? null;
    const oldItem = oldPriceId
      ? subscription.items.data.find((i) => i.price.id === oldPriceId)
      : subscription.items.data[0];

    if (!oldItem) {
      console.error("[change-tier/confirm] No subscription item to swap", {
        subscription_id: subscription.id,
        oldPriceId,
      });
      return NextResponse.json(
        { error: "Could not locate current subscription item to update" },
        { status: 500 }
      );
    }

    // ── Stripe update — if this throws, DB is NOT mutated ──────────────────
    try {
      await stripe.subscriptionItems.update(oldItem.id, {
        price: targetTier.stripe_price_id,
        quantity: 1,
        proration_behavior: "always_invoice",
      });

      if (targetTier.stripe_extra_price_id) {
        await updateStripeExtraSeats(
          member.stripe_subscription_id,
          targetTier.stripe_extra_price_id,
          newExtraCount
        );
      }
    } catch (err) {
      console.error("[change-tier/confirm] Stripe update failed", {
        subscription_id: subscription.id,
        user_id: user.id,
        target_tier_id: targetTierId,
        err,
      });
      return NextResponse.json(
        {
          error:
            "Payment update failed. Your current plan is unchanged. Please try again or update your payment method.",
        },
        { status: 502 }
      );
    }

    // ── Stripe succeeded → now update DB ──────────────────────────────────
    // Keep the legacy `plan_type` flag in sync with the canonical tier per
    // `tasks/23.04.2026/community-pm-entitlement-state-sync/00-audit-note.md`
    // §2. Without this, a Family → Individual downgrade would leave
    // `plan_type = 'family'` and older routes (like GET /api/community/family)
    // would continue granting Family access.
    const canonicalPlanType = tierToPlanType({ name: targetTier.name });
    const { error: updateErr } = await admin
      .from("community_members")
      .update({
        pm_tier_id: targetTierId,
        plan_type: canonicalPlanType,
        extra_member_count: newExtraCount,
      })
      .eq("id", member.id);

    if (updateErr) {
      // Stripe charged but DB update failed — needs manual reconciliation.
      console.error(
        "[change-tier/confirm] CRITICAL: Stripe updated but DB update failed — manual reconciliation required",
        {
          subscription_id: subscription.id,
          user_id: user.id,
          member_id: member.id,
          target_tier_id: targetTierId,
          err: updateErr,
        }
      );
      return NextResponse.json(
        {
          error:
            "Your payment was processed but we could not update your plan record. Our team has been notified. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tier: {
        id: targetTier.id,
        name: targetTier.name,
        base_price_usd: Number(targetTier.base_price_usd),
        base_member_limit: targetTier.base_member_limit,
        extra_per_member_usd: Number(targetTier.extra_per_member_usd),
        max_total_members: targetTier.max_total_members,
      },
      extra_member_count: newExtraCount,
    });
  } catch (err) {
    console.error("[change-tier/confirm] unexpected error", err);
    return NextResponse.json(
      { error: "Failed to confirm tier change" },
      { status: 500 }
    );
  }
}
