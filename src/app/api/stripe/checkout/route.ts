import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/billing";
import { PLANS, type PlanId } from "@/lib/plans";
import { APP_URL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, userId, planId, affiliateCode } = await request.json();

    if (!email || !userId || !planId) {
      return NextResponse.json(
        { error: "Missing email, userId, or planId" },
        { status: 400 }
      );
    }

    // ── Legacy hardcoded plans (tarot, astrology, both) ──
    if (PLANS[planId as PlanId]) {
      const setupEnvKey = PLANS[planId as PlanId].setupEnvKey;
      const monthlyEnvKey = PLANS[planId as PlanId].monthlyEnvKey;
      const setupPriceId = process.env[setupEnvKey];
      const monthlyPriceId = process.env[monthlyEnvKey];

      if (!setupPriceId || !monthlyPriceId) {
        return NextResponse.json(
          { error: `Stripe prices not configured. Missing: ${!setupPriceId ? setupEnvKey : ""} ${!monthlyPriceId ? monthlyEnvKey : ""}`.trim() },
          { status: 500 }
        );
      }

      const session = await createCheckoutSession({
        email,
        userId,
        planId: planId as PlanId,
        successUrl: `${APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${APP_URL}/get-started?cancelled=true`,
        affiliateCode: affiliateCode || undefined,
      });

      return NextResponse.json({ url: session.url });
    }

    // ── DB-driven plans (trainee, combos, community, etc.) ──
    const admin = createAdminClient();
    const { data: dbPlan } = await admin
      .from("pricing_plans")
      .select(
        "plan_id, display_name, stripe_price_id, onetime_amount, recurring_amount, recurring_interval, item_id, global_pricing(item_key, item_name)"
      )
      .eq("plan_id", planId)
      .eq("is_active", true)
      .single();

    if (!dbPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Build Stripe line items from DB plan
    const lineItems: { price: string; quantity: number }[] = [];

    if (dbPlan.stripe_price_id) {
      // Plan has a single Stripe price — use it directly
      lineItems.push({ price: dbPlan.stripe_price_id, quantity: 1 });
    } else {
      // No Stripe price configured yet — cannot proceed
      return NextResponse.json(
        { error: "This plan is not yet available for purchase. Stripe price not configured." },
        { status: 422 }
      );
    }

    const isRecurring = !!dbPlan.recurring_amount && !!dbPlan.recurring_interval;
    const itemInfo = dbPlan.global_pricing as unknown as { item_key: string; item_name: string } | null;

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: isRecurring ? "subscription" : "payment",
      line_items: lineItems,
      metadata: {
        userId,
        planId,
        itemKey: itemInfo?.item_key ?? "",
        planName: dbPlan.display_name,
        ...(affiliateCode ? { affiliateCode } : {}),
      },
      success_url: `${APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/get-started?cancelled=true`,
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
