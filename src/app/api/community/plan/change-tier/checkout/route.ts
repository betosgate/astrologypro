/**
 * POST /api/community/plan/change-tier/checkout
 *
 * Creates a new recurring Stripe Checkout session for a Community member
 * who does NOT have an active recurring subscription (one-time / manual /
 * no-subscription users). The session uses the target tier's recurring
 * stripe_price_id. On success the webhook updates community_members.
 *
 * Body: { target_tier_id: string }
 * Response: { checkout_url: string }
 *
 * This route never updates pm_tier_id — that happens only after
 * Stripe confirms the checkout via webhook.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // Verify member exists
    const { data: member, error: memberErr } = await admin
      .from("community_members")
      .select("id, stripe_customer_id, pm_tier_id")
      .eq("user_id", user.id)
      .single();
    if (memberErr || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    // Validate target tier has a recurring stripe_price_id
    const { data: targetTier, error: tierErr } = await admin
      .from("pm_plan_tiers")
      .select("id, name, stripe_price_id, is_active")
      .eq("id", targetTierId)
      .single();
    if (tierErr || !targetTier) {
      return NextResponse.json(
        { error: "Target tier not found" },
        { status: 404 }
      );
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

    // Resolve (or create) a Stripe customer for the user
    const customerId = await getOrCreateStripeCustomer(user.email ?? "", {
      supabase_user_id: user.id,
    });

    // New flow identifier — do NOT reuse perennial_community_signup,
    // trainee_signup, or mystery_school metadata values.
    const metadata: Record<string, string> = {
      flow: "community_plan_subscription_conversion",
      user_id: user.id,
      community_member_id: member.id,
      target_tier_id: targetTierId,
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: targetTier.stripe_price_id, quantity: 1 }],
      metadata,
      // Mirror metadata onto the subscription itself so later webhook
      // events (customer.subscription.updated, etc.) can identify the flow.
      subscription_data: { metadata },
      success_url: `${APP_URL}/community/plan?conversion=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/community/plan?conversion=cancelled`,
    });

    if (!session.url) {
      console.error("[change-tier/checkout] Stripe did not return a session URL", {
        session_id: session.id,
      });
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkout_url: session.url });
  } catch (err) {
    console.error("[change-tier/checkout] unexpected error", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
