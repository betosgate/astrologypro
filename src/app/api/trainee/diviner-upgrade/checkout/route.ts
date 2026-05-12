import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PricingPlanRow = {
  plan_id: string;
  display_name: string;
  stripe_price_id: string | null;
  onetime_amount: number | null;
  onetime_currency: string | null;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  global_pricing:
    | {
        item_key: string;
        item_name: string;
      }
    | {
        item_key: string;
        item_name: string;
      }[]
    | null;
};

const COURSE_ITEM_KEY = "professional_divination_course";

export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { planId?: string };
    const planId = body.planId?.trim();

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const [
      { data: trainee },
      { data: pmMember },
      { data: existingDiviner },
    ] = await Promise.all([
      admin
        .from("trainees")
        .select("id, name, email, username")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("community_members")
        .select("id, full_name, email")
        .eq("user_id", user.id)
        .eq("membership_type", "perennial_mandalism")
        .eq("membership_status", "active")
        .maybeSingle(),
      admin
        .from("diviners")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!trainee && !pmMember) {
      return NextResponse.json(
        {
          error:
            "Only trainees or active Perennial Mandalism members can start this upgrade checkout.",
        },
        { status: 403 },
      );
    }

    if (existingDiviner) {
      return NextResponse.json(
        { error: "Your diviner account already exists." },
        { status: 409 },
      );
    }

    const { data: rawPlan } = await admin
      .from("pricing_plans")
      .select(
        "plan_id, display_name, stripe_price_id, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval, global_pricing(item_key, item_name)",
      )
      .eq("plan_id", planId)
      .eq("is_active", true)
      .single();

    const dbPlan = rawPlan as PricingPlanRow | null;
    if (!dbPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const itemInfo = Array.isArray(dbPlan.global_pricing)
      ? (dbPlan.global_pricing[0] ?? null)
      : dbPlan.global_pricing;

    if (itemInfo?.item_key !== COURSE_ITEM_KEY) {
      return NextResponse.json(
        { error: "Selected plan is not a diviner upgrade plan." },
        { status: 422 },
      );
    }

    const hasRecurring = Boolean(dbPlan.stripe_price_id);
    const hasOneTime =
      typeof dbPlan.onetime_amount === "number" && dbPlan.onetime_amount > 0;

    if (!hasRecurring && !hasOneTime) {
      return NextResponse.json(
        { error: "Plan has no configured price. Contact support." },
        { status: 422 },
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (hasRecurring && dbPlan.stripe_price_id) {
      lineItems.push({ price: dbPlan.stripe_price_id, quantity: 1 });
    }

    if (hasOneTime && dbPlan.onetime_amount) {
      lineItems.push({
        price_data: {
          currency: (
            dbPlan.onetime_currency ??
            dbPlan.recurring_currency ??
            "USD"
          ).toLowerCase(),
          unit_amount: Math.round(dbPlan.onetime_amount * 100),
          product_data: {
            name: hasRecurring
              ? `${dbPlan.display_name} - Setup Fee`
              : dbPlan.display_name,
          },
        },
        quantity: 1,
      });
    }

    const email = (trainee?.email ?? pmMember?.email ?? user.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "No email address is available for this account." },
        { status: 422 },
      );
    }

    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customerId = existingCustomers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id,
          role: trainee ? "trainee" : "perennial_mandalism",
        },
      });
      customerId = customer.id;
    }

    const metadata: Stripe.MetadataParam = {
      userId: user.id,
      planId,
      itemKey: COURSE_ITEM_KEY,
      planName: dbPlan.display_name,
      type: "trainee_diviner_upgrade",
      sourceRole: trainee ? "trainee" : "perennial_mandalism",
    };

    if (trainee?.id) {
      metadata.traineeId = trainee.id;
    }

    if (pmMember?.id) {
      metadata.pmMemberId = pmMember.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: hasRecurring ? "subscription" : "payment",
      line_items: lineItems,
      metadata,
      success_url: `${origin}/trainee/diviner-upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/join/diviner/error?source=trainee-upgrade&reason=cancelled`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    console.error("[trainee/diviner-upgrade/checkout] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
