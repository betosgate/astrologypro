import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PricingPlanUpgradeRow = {
  plan_id: string;
  display_name: string;
  item_id: string;
  stripe_price_id: string | null;
  recurring_amount: number | null;
  custom_fields:
    | {
        slug?: string;
        value?: string;
      }[]
    | null;
};

/**
 * POST /api/stripe/upgrade
 * Upgrades (or switches) a diviner's subscription to a new DB-driven plan with proration.
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

    if (!newPlanId) {
      return NextResponse.json({ error: "Missing newPlanId" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: rawPlan, error: planError } = await admin
      .from("pricing_plans")
      .select("plan_id, display_name, item_id, stripe_price_id, recurring_amount, custom_fields")
      .eq("plan_id", newPlanId)
      .eq("is_active", true)
      .maybeSingle();

    const newPlan = rawPlan as PricingPlanUpgradeRow | null;

    if (planError || !newPlan || !newPlan.stripe_price_id) {
      return NextResponse.json(
        { error: "Invalid or unconfigured plan" },
        { status: 400 }
      );
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

    const isExplicitUpgradeTarget =
      newPlan.custom_fields?.find((field) => field.slug === "is_full_plan")?.value ===
      "true";

    let isHigherRecurringPlan = false;

    if (diviner.plan_id) {
      const { data: currentPlan } = await admin
        .from("pricing_plans")
        .select("item_id, recurring_amount")
        .eq("plan_id", diviner.plan_id)
        .maybeSingle();

      isHigherRecurringPlan =
        !!currentPlan &&
        currentPlan.item_id === newPlan.item_id &&
        (newPlan.recurring_amount ?? 0) > (currentPlan.recurring_amount ?? 0);
    }

    if (!isExplicitUpgradeTarget && !isHigherRecurringPlan) {
      return NextResponse.json(
        { error: "Downgrades are not supported. Contact support." },
        { status: 400 }
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
          price: newPlan.stripe_price_id,
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
