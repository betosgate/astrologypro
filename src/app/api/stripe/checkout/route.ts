import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { APP_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin") || APP_URL;
    const baseUrl = origin.endsWith("/") ? origin.slice(0, -1) : origin;

    const { email, userId, planId, affiliateCode } = await request.json();

    if (!email || !userId || !planId) {
      return NextResponse.json(
        { error: "Missing email, userId, or planId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: rawPlan } = await admin
      .from("pricing_plans")
      .select(
        "plan_id, display_name, stripe_price_id, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval, global_pricing(item_key, item_name)"
      )
      .eq("plan_id", planId)
      .eq("is_active", true)
      .single();

    const dbPlan = rawPlan as PricingPlanRow | null;

    if (!dbPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const hasRecurring = Boolean(dbPlan.stripe_price_id);
    const hasOneTime = typeof dbPlan.onetime_amount === "number" && dbPlan.onetime_amount > 0;

    if (!hasRecurring && !hasOneTime) {
      return NextResponse.json(
        { error: "Plan has no configured price. Contact support." },
        { status: 422 }
      );
    }

    const itemInfo = Array.isArray(dbPlan.global_pricing)
      ? (dbPlan.global_pricing[0] ?? null)
      : dbPlan.global_pricing;
    const itemKey = itemInfo?.item_key ?? "";

    const typeTag =
      itemKey === "trainee_program"
        ? "trainee_signup"
        : itemKey === "perennial_mandalism_community"
          ? "perennial_community_signup"
          : undefined;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (hasRecurring && dbPlan.stripe_price_id) {
      lineItems.push({ price: dbPlan.stripe_price_id, quantity: 1 });
    }

    if (hasOneTime && dbPlan.onetime_amount) {
      lineItems.push({
        price_data: {
          currency: (dbPlan.onetime_currency ?? dbPlan.recurring_currency ?? "USD").toLowerCase(),
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

    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    let customerId = existingCustomers.data[0]?.id;
    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: email,
        metadata: { userId },
      });
      customerId = newCustomer.id;
    }

    const successPath =
      itemKey === "perennial_mandalism_community"
        ? "/perennial-signup/success?session_id={CHECKOUT_SESSION_ID}"
        : itemKey === "trainee_program"
          ? "/join/trainee/profile?session_id={CHECKOUT_SESSION_ID}"
          : "/onboarding?session_id={CHECKOUT_SESSION_ID}";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: hasRecurring ? "subscription" : "payment",
      line_items: lineItems,
      metadata: {
        userId,
        planId,
        itemKey,
        planName: dbPlan.display_name,
        ...(typeTag ? { type: typeTag } : {}),
        ...(affiliateCode ? { affiliateCode } : {}),
      },
      success_url: `${baseUrl}${successPath}`,
      cancel_url: `${baseUrl}/get-started?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (error as any)?.raw ?? (error as any)?.code ?? "";
    console.error("Stripe checkout error:", msg, detail);
    return NextResponse.json(
      { error: msg, detail },
      { status: 500 }
    );
  }
}
