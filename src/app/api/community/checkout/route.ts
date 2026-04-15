import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/checkout
 * Creates a Stripe Checkout session for community membership.
 *
 * All pricing (amounts, Stripe price IDs) is read from the `pricing_plans`
 * table — the admin pricing screen is the single source of truth.
 *
 * Mystery School plans:
 *   - plan_mystery_monthly:             recurring subscription + optional one-time enrollment
 *   - plan_mystery_monthly_pm_discount: discounted recurring for active PM members
 *
 * Perennial Mandalism plans:
 *   - plan_pm_individual / plan_pm_couple / plan_pm_family
 *
 * Body for mystery_school:
 * {
 *   membershipType: "mystery_school",
 *   planType?: "individual",
 *   entry_quarter: "spring" | "summer" | "autumn" | "winter",
 *   entry_year: number,
 * }
 *
 * PM and MS memberships coexist (parallel entitlement model).
 * Buying MS does NOT cancel an existing PM subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to subscribe." }, { status: 401 });
    }

    const body = await request.json();
    const {
      membershipType,
      planType,
      entry_quarter,
      entry_year,
    } = body as {
      membershipType: string;
      planType?: string;
      entry_quarter?: string;
      entry_year?: number;
    };

    // --- Input validation ---
    if (!["perennial_mandalism", "mystery_school"].includes(membershipType)) {
      return NextResponse.json({ error: "Invalid membership type" }, { status: 400 });
    }

    const isMysterySchool = membershipType === "mystery_school";

    if (isMysterySchool) {
      const validQuarters = ["spring", "summer", "autumn", "winter"];
      if (!entry_quarter || !validQuarters.includes(entry_quarter)) {
        return NextResponse.json(
          { error: "entry_quarter must be one of: spring, summer, autumn, winter" },
          { status: 422 }
        );
      }
      if (!entry_year || typeof entry_year !== "number" || entry_year < 2026) {
        return NextResponse.json(
          { error: "entry_year must be a valid year (2026 or later)" },
          { status: 422 }
        );
      }
    }

    const isFamily = planType === "family" && !isMysterySchool;
    const isCouple = planType === "couple" && !isMysterySchool;
    const admin = createAdminClient();

    // --- Build Stripe line items from pricing_plans ---
    //
    // Stripe mode: "subscription" allows mixing a saved one-time Price with
    // recurring line items, but does NOT allow inline price_data without
    // `recurring`. For one-time fees without a saved Stripe Price, we create
    // an ad-hoc Stripe Price on the fly via stripe.prices.create().
    let lineItems: Array<{ price: string; quantity: 1 }> = [];

    if (isMysterySchool) {
      // Determine which plan to use: standard or PM discount
      let planId = "plan_mystery_monthly";

      // Check if PM-discount applies
      const [memberResult, settingsResult] = await Promise.all([
        admin
          .from("community_members")
          .select("id, membership_type, membership_status")
          .eq("user_id", user.id)
          .eq("membership_type", "perennial_mandalism")
          .eq("membership_status", "active")
          .maybeSingle(),
        admin
          .from("platform_settings")
          .select("ms_pm_discount_enabled")
          .limit(1)
          .single(),
      ]);

      const isActivePm = !!memberResult.data;
      const discountEnabled = settingsResult.data?.ms_pm_discount_enabled ?? true;

      if (isActivePm && discountEnabled) {
        planId = "plan_mystery_monthly_pm_discount";
      }

      // Fetch the selected plan from pricing_plans
      const { data: plan, error: planErr } = await admin
        .from("pricing_plans")
        .select("plan_id, display_name, onetime_amount, onetime_currency, recurring_amount, recurring_currency, recurring_interval, stripe_price_id")
        .eq("plan_id", planId)
        .eq("is_active", true)
        .single();

      if (planErr || !plan) {
        return NextResponse.json(
          { error: "Mystery School pricing plan not found or inactive." },
          { status: 500 }
        );
      }

      // One-time enrollment fee — create an ad-hoc Stripe Price
      if (plan.onetime_amount != null && plan.onetime_amount > 0) {
        const onetimePrice = await stripe.prices.create({
          currency: (plan.onetime_currency ?? "USD").toLowerCase(),
          unit_amount: Math.round(plan.onetime_amount * 100),
          product_data: { name: `${plan.display_name} — Enrollment Fee` },
        });
        lineItems.push({ price: onetimePrice.id, quantity: 1 });
      }

      // Recurring subscription — use stripe_price_id from pricing_plans
      if (plan.stripe_price_id) {
        lineItems.push({ price: plan.stripe_price_id, quantity: 1 });
      } else if (plan.recurring_amount != null && plan.recurring_amount > 0) {
        // Fallback: create ad-hoc recurring price if no stripe_price_id configured
        const recurringPrice = await stripe.prices.create({
          currency: (plan.recurring_currency ?? "USD").toLowerCase(),
          unit_amount: Math.round(plan.recurring_amount * 100),
          recurring: { interval: (plan.recurring_interval ?? "month") as "month" | "year" },
          product_data: { name: plan.display_name },
        });
        lineItems.push({ price: recurringPrice.id, quantity: 1 });
      }

      if (lineItems.length === 0) {
        return NextResponse.json(
          { error: "Mystery School plan has no configured prices." },
          { status: 500 }
        );
      }
    } else {
      // Perennial Mandalism — resolve plan_id from planType
      const pmPlanId = isFamily
        ? "plan_pm_family"
        : isCouple
          ? "plan_pm_couple"
          : "plan_pm_individual";

      const { data: plan, error: planErr } = await admin
        .from("pricing_plans")
        .select("stripe_price_id, display_name, recurring_amount, recurring_currency, recurring_interval, onetime_amount, onetime_currency")
        .eq("plan_id", pmPlanId)
        .eq("is_active", true)
        .single();

      if (planErr || !plan) {
        return NextResponse.json(
          { error: "Community pricing plan not found or inactive." },
          { status: 500 }
        );
      }

      // One-time fee if configured — create an ad-hoc Stripe Price
      if (plan.onetime_amount != null && plan.onetime_amount > 0) {
        const onetimePrice = await stripe.prices.create({
          currency: (plan.onetime_currency ?? "USD").toLowerCase(),
          unit_amount: Math.round(plan.onetime_amount * 100),
          product_data: { name: `${plan.display_name} — One-Time Fee` },
        });
        lineItems.push({ price: onetimePrice.id, quantity: 1 });
      }

      // Recurring subscription
      if (plan.stripe_price_id) {
        lineItems.push({ price: plan.stripe_price_id, quantity: 1 });
      } else if (plan.recurring_amount != null && plan.recurring_amount > 0) {
        const recurringPrice = await stripe.prices.create({
          currency: (plan.recurring_currency ?? "USD").toLowerCase(),
          unit_amount: Math.round(plan.recurring_amount * 100),
          recurring: { interval: (plan.recurring_interval ?? "month") as "month" | "year" },
          product_data: { name: plan.display_name },
        });
        lineItems.push({ price: recurringPrice.id, quantity: 1 });
      }

      if (lineItems.length === 0) {
        return NextResponse.json(
          { error: "Community plan has no configured prices." },
          { status: 500 }
        );
      }
    }

    // --- Build metadata ---
    const metadata: Record<string, string> = {
      type: "community",
      userId: user.id,
      membershipType,
      planType: isFamily ? "family" : isCouple ? "couple" : "individual",
    };

    if (isMysterySchool && entry_quarter && entry_year) {
      metadata.entry_quarter = entry_quarter;
      metadata.entry_year = String(entry_year);
    }

    // Route success/cancel URLs to the correct portal context
    const successUrl = isMysterySchool
      ? `${APP_URL}/mystery-school/checkout/success?session_id={CHECKOUT_SESSION_ID}`
      : `${APP_URL}/community/onboarding?subscribed=true`;
    const cancelUrl = isMysterySchool
      ? `${APP_URL}/mystery-school/checkout/cancel`
      : `${APP_URL}/community/upgrade`;

    const customerId = await getOrCreateStripeCustomer(user.email!, { supabase_user_id: user.id });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: lineItems,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[community/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
