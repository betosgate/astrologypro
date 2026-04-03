import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * POST /api/stripe/upgrade
 * Upgrades (or switches) a diviner's subscription to a new plan with proration.
 * Only "both" is a valid upgrade target from "tarot" or "astrology".
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

    const { newPlanId } = await request.json();

    if (!newPlanId || !PLANS[newPlanId as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { data: diviner } = await supabase
      .from("diviners")
      .select("id, plan_id, stripe_subscription_id, subscription_status")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    if (diviner.subscription_status !== "active") {
      return NextResponse.json(
        { error: "No active subscription to upgrade" },
        { status: 400 }
      );
    }

    if (!diviner.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No Stripe subscription found" },
        { status: 400 }
      );
    }

    if (diviner.plan_id === newPlanId) {
      return NextResponse.json(
        { error: "Already on this plan" },
        { status: 400 }
      );
    }

    // Only allow upgrading to "both"
    if (newPlanId !== "both") {
      return NextResponse.json(
        { error: "Downgrades are not supported. Contact support." },
        { status: 400 }
      );
    }

    const newMonthlyPriceId =
      process.env[PLANS[newPlanId as PlanId].monthlyEnvKey];
    if (!newMonthlyPriceId) {
      return NextResponse.json(
        { error: "New plan price not configured" },
        { status: 500 }
      );
    }

    // Fetch the current subscription to find the monthly item
    const subscription = await stripe.subscriptions.retrieve(
      diviner.stripe_subscription_id
    );

    // Find the recurring (monthly) item — skip one-time setup fees
    const monthlyItem = subscription.items.data.find(
      (item) => item.price.recurring !== null
    );

    if (!monthlyItem) {
      return NextResponse.json(
        { error: "Could not find monthly subscription item" },
        { status: 500 }
      );
    }

    // Swap the monthly price item with proration
    await stripe.subscriptions.update(diviner.stripe_subscription_id, {
      items: [
        {
          id: monthlyItem.id,
          price: newMonthlyPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // Update plan_id in DB
    await supabase
      .from("diviners")
      .update({ plan_id: newPlanId })
      .eq("id", diviner.id);

    return NextResponse.json({ success: true, newPlanId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[stripe/upgrade] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
