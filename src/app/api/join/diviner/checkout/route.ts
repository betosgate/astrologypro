import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/join/diviner/checkout
 *
 * Spec source:
 *   docs/tasks/2026-04-30/diviner-invite-registration-plan-gating.md
 *
 * Body: { planId: string }
 *
 * Authenticated by the just-created diviner account from
 * /api/join/diviner/register (the /join/diviner page signs in client-side
 * before redirecting to /join/diviner/plan, so the SSR client has cookies).
 *
 * Mirrors the trainee→diviner upgrade checkout shape so the existing
 * Stripe webhook plumbing stays consistent — the only difference is the
 * `metadata.type` discriminator, which the webhook uses to route to the
 * `invited_diviner` provisioner (no trainee row read, no `markTraineePaid`).
 *
 * Allowed callers:
 *   - The signed-in user MUST own a `diviners` row (created during
 *     /api/join/diviner/register).
 *   - The diviner row MUST NOT already have subscription_status='active'
 *     (idempotency: a paid diviner shouldn't be able to start a second
 *     checkout for the same Professional Divination Course onboarding).
 */

const COURSE_ITEM_KEY = "professional_divination_course";

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
    | { item_key: string; item_name: string }
    | { item_key: string; item_name: string }[]
    | null;
};

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

    const body = (await request.json().catch(() => ({}))) as {
      planId?: string;
    };
    const planId = body.planId?.trim();
    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Caller must already have a diviner record (created by the
    //    register endpoint) and must not be already paid.
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, user_id, display_name, username, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!diviner) {
      return NextResponse.json(
        {
          error:
            "No diviner registration found for this account. Please complete /join/diviner first.",
        },
        { status: 404 }
      );
    }
    if (diviner.subscription_status === "active") {
      return NextResponse.json(
        { error: "Your diviner plan is already active." },
        { status: 409 }
      );
    }

    // ── Validate the requested plan against the canonical pricing source.
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
    const itemInfo = Array.isArray(dbPlan.global_pricing)
      ? dbPlan.global_pricing[0] ?? null
      : dbPlan.global_pricing;
    if (itemInfo?.item_key !== COURSE_ITEM_KEY) {
      return NextResponse.json(
        { error: "Selected plan is not a diviner upgrade plan." },
        { status: 422 }
      );
    }

    const hasRecurring = Boolean(dbPlan.stripe_price_id);
    const hasOneTime =
      typeof dbPlan.onetime_amount === "number" && dbPlan.onetime_amount > 0;
    if (!hasRecurring && !hasOneTime) {
      return NextResponse.json(
        { error: "Plan has no configured price. Contact support." },
        { status: 422 }
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

    const email = (user.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "No email address available for this account." },
        { status: 422 }
      );
    }

    // Re-use any existing Stripe customer for this email so test/staging
    // runs don't create a duplicate. Same pattern as the trainee endpoint.
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId = existingCustomers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: user.id, role: "invited_diviner" },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: hasRecurring ? "subscription" : "payment",
      line_items: lineItems,
      metadata: {
        userId: user.id,
        divinerId: diviner.id,
        planId,
        planName: dbPlan.display_name,
        itemKey: COURSE_ITEM_KEY,
        type: "invited_diviner",
      },
      success_url: `${origin}/join/diviner/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/join/diviner/plan?cancelled=1`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error("[join/diviner/checkout] error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
