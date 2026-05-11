/**
 * POST /api/community/plan/change-tier/preview
 *
 * Classifies the authenticated member's payment state for an intended
 * tier change and (when applicable) returns a Stripe-authoritative
 * prorated upgrade preview.
 *
 * Body: { target_tier_id: string }
 *
 * Decisions (field: `decision`):
 *   - "active_subscription_upgrade"   → returns prorated upgrade preview
 *   - "requires_recurring_checkout"   → caller should POST /checkout
 *   - "blocked_payment_state"         → show recoverable error / fix payment
 *
 * This endpoint is read-only — it never mutates DB or Stripe.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Decision =
  | "active_subscription_upgrade"
  | "requires_recurring_checkout"
  | "blocked_payment_state";

const ACTIVE_SUB_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];
const BLOCKED_SUB_STATUSES: Stripe.Subscription.Status[] = [
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
];

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

    // Fetch member + current tier
    const { data: member, error: memberErr } = await admin
      .from("community_members")
      .select(
        `id,
         stripe_customer_id,
         stripe_subscription_id,
         membership_status,
         pm_tier_id,
         pm_plan_tiers (
           id, name, base_price_usd, stripe_price_id, stripe_extra_price_id, base_member_limit
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

    const rawCurrentTier = member.pm_plan_tiers;
    const currentTier = Array.isArray(rawCurrentTier)
      ? (rawCurrentTier[0] as Record<string, unknown> | undefined) ?? null
      : (rawCurrentTier as Record<string, unknown> | null);

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
      };
    } else if (targetTierId === "plan_pm_couple") {
      targetTier = {
        id: "plan_pm_couple",
        name: "Couple Plan",
        base_price_usd: 29.95,
        base_member_limit: 2,
        stripe_price_id: "price_1RtmCKBcRXKECv5fCP1Radka",
        is_active: true,
      };
    } else if (targetTierId === "plan_pm_family") {
      targetTier = {
        id: "plan_pm_family",
        name: "Family Plan",
        base_price_usd: 39.95,
        base_member_limit: 5,
        stripe_price_id: "price_1RtmBbBcRXKECv5fun9Xjjwi",
        is_active: true,
      };
    } else {
      const { data, error: tierErr } = await admin
        .from("pm_plan_tiers")
        .select(
          "id, name, description, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members, stripe_price_id, stripe_extra_price_id, is_active"
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

    const targetPriceCents = Math.round(Number(targetTier.base_price_usd) * 100);
    const currentPriceCents = Math.round(
      Number((currentTier?.base_price_usd as number | undefined) ?? 0) * 100
    );

    // No Stripe subscription on file → requires checkout
    if (!member.stripe_subscription_id) {
      return respondRequiresCheckout({
        currentTier,
        targetTier,
        currentPriceCents,
        targetPriceCents,
        reason: "no_subscription",
      });
    }

    // Verify the subscription live with Stripe
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(
        member.stripe_subscription_id
      );
    } catch (err) {
      console.error(
        "[change-tier/preview] Stripe subscription retrieve failed",
        { subscription_id: member.stripe_subscription_id, err }
      );
      // Treat retrieval failure as needing a fresh checkout rather than blocking
      return respondRequiresCheckout({
        currentTier,
        targetTier,
        currentPriceCents,
        targetPriceCents,
        reason: "subscription_not_found",
      });
    }

    if (BLOCKED_SUB_STATUSES.includes(subscription.status)) {
      return NextResponse.json({
        decision: "blocked_payment_state" as Decision,
        subscription_status: subscription.status,
        reason: `Your current subscription is ${subscription.status}. Please update your payment method before changing tiers.`,
        can_fix_via_billing_portal: true,
        current_tier: currentTier
          ? {
              id: currentTier.id as string,
              name: currentTier.name as string,
              price_cents: currentPriceCents,
            }
          : null,
        target_tier: {
          id: targetTier.id,
          name: targetTier.name,
          price_cents: targetPriceCents,
        },
        currency: "usd",
      });
    }

    if (
      subscription.status === "canceled" ||
      !ACTIVE_SUB_STATUSES.includes(subscription.status)
    ) {
      return respondRequiresCheckout({
        currentTier,
        targetTier,
        currentPriceCents,
        targetPriceCents,
        reason: `subscription_status_${subscription.status}`,
      });
    }

    // ─── Active subscription → compute prorated preview via Stripe ──────────
    const oldPriceId = (currentTier?.stripe_price_id as string | undefined) ?? null;
    const subItem = oldPriceId
      ? subscription.items.data.find((i) => i.price.id === oldPriceId)
      : subscription.items.data[0];

    if (!subItem) {
      console.warn(
        "[change-tier/preview] No matching subscription item for current price",
        { subscription_id: subscription.id, oldPriceId }
      );
      return respondRequiresCheckout({
        currentTier,
        targetTier,
        currentPriceCents,
        targetPriceCents,
        reason: "subscription_item_mismatch",
      });
    }

    // Ask Stripe for the upcoming (preview) invoice assuming we swap the item.
    let proratedAmountCents = 0;
    let nextRenewalAmountCents = targetPriceCents;
    let periodStart: number | null = null;
    let periodEnd: number | null = null;

    try {
      // Use the Stripe `createPreview` API (successor to retrieveUpcoming in
      // Stripe API 2024-06-20+). Fall back gracefully if unavailable.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoicesApi = stripe.invoices as any;
      const params = {
        customer: subscription.customer as string,
        subscription: subscription.id,
        subscription_details: {
          items: [
            {
              id: subItem.id,
              price: targetTier.stripe_price_id,
              quantity: 1,
            },
          ],
          proration_behavior: "always_invoice",
        },
      };

      const preview: Stripe.Invoice =
        typeof invoicesApi.createPreview === "function"
          ? await invoicesApi.createPreview(params)
          : await invoicesApi.retrieveUpcoming(params);

      // Sum only proration line items for the amount due now
      // (Stripe marks these with `proration: true` at runtime; the type
      // definition varies across SDK versions, so access loosely.)
      const lines = (preview.lines?.data ?? []) as Array<
        Stripe.InvoiceLineItem & { proration?: boolean }
      >;
      const prorationLines = lines.filter((l) => Boolean(l.proration));
      if (prorationLines.length > 0) {
        proratedAmountCents = prorationLines.reduce(
          (s, l) => s + Number(l.amount ?? 0),
          0
        );
      } else {
        // No proration lines (rare) — fall back to amount_due
        proratedAmountCents = Number(preview.amount_due ?? 0);
      }
      // Guard against negative (downgrade credit). Never charge < 0.
      if (proratedAmountCents < 0) proratedAmountCents = 0;

      // Period
      periodStart = Number(subItem.current_period_start ?? subscription.start_date ?? 0) || null;
      periodEnd = Number(subItem.current_period_end ?? 0) || null;
    } catch (err) {
      console.error("[change-tier/preview] Stripe preview invoice failed", err);
      // Fall back to pessimistic estimate: charge full target price now.
      // Better to overstate than understate to avoid free upgrades.
      proratedAmountCents = Math.max(0, targetPriceCents - currentPriceCents);
    }

    return NextResponse.json({
      decision: "active_subscription_upgrade" as Decision,
      subscription_status: subscription.status,
      current_tier: currentTier
        ? {
            id: currentTier.id as string,
            name: currentTier.name as string,
            price_cents: currentPriceCents,
          }
        : null,
      target_tier: {
        id: targetTier.id,
        name: targetTier.name,
        price_cents: targetPriceCents,
      },
      preview: {
        current_plan_price_cents: currentPriceCents,
        target_plan_price_cents: targetPriceCents,
        prorated_amount_due_cents: proratedAmountCents,
        next_renewal_amount_cents: nextRenewalAmountCents,
        billing_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        billing_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        new_renewal_date: null, // set at confirm time (new cycle starts on upgrade)
      },
      currency: "usd",
    });
  } catch (err) {
    console.error("[change-tier/preview] unexpected error", err);
    return NextResponse.json(
      { error: "Failed to build upgrade preview" },
      { status: 500 }
    );
  }
}

function respondRequiresCheckout(args: {
  currentTier: Record<string, unknown> | null;
  targetTier: Record<string, unknown>;
  currentPriceCents: number;
  targetPriceCents: number;
  reason: string;
}) {
  return NextResponse.json({
    decision: "requires_recurring_checkout" as Decision,
    reason: args.reason,
    current_tier: args.currentTier
      ? {
          id: args.currentTier.id as string,
          name: args.currentTier.name as string,
          price_cents: args.currentPriceCents,
        }
      : null,
    target_tier: {
      id: args.targetTier.id as string,
      name: args.targetTier.name as string,
      price_cents: args.targetPriceCents,
    },
    currency: "usd",
  });
}
