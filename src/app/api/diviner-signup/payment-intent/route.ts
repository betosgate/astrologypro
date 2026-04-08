import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/diviner-signup/payment-intent
 *
 * Creates a one-time Stripe PaymentIntent for the Professional Divination
 * Course. Called by /diviner-signup after a successful registration so the
 * client can render the Stripe Elements modal and confirm payment in-page.
 *
 * Body:
 *   { user_id: string, email: string, name?: string }
 *
 * Pricing comes from the global_pricing row keyed on
 * `professional_divination_course` — admin-managed via /admin/pricing.
 * Currency comes from that row (INR by default).
 *
 * Response (201):
 *   { client_secret, payment_intent_id, amount, currency }
 *
 * Errors: 400/422 invalid body, 404 user/pricing missing, 500 stripe error
 */
const COURSE_ITEM_KEY = "professional_divination_course";
// Stripe smallest unit table — only the currencies we actually use here.
// USD/INR are both 2-decimal so amount * 100 is correct.
const SMALLEST_UNIT_MULTIPLIER: Record<string, number> = {
  USD: 100,
  INR: 100,
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = String(body.user_id ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 422 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Verify the user actually exists. The client just registered them via
  // /api/diviner-signup so this should succeed; if it doesn't, we won't
  // create a payment intent for a phantom user.
  const { data: authUserData } = await admin.auth.admin.getUserById(userId);
  if (!authUserData?.user) {
    return NextResponse.json(
      { error: "User not found — register before requesting payment" },
      { status: 404 },
    );
  }

  // Read the live course price.
  const { data: pricing } = await admin
    .from("global_pricing")
    .select("price, currency, item_name")
    .eq("item_key", COURSE_ITEM_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!pricing) {
    return NextResponse.json(
      {
        error:
          "Course pricing is not configured. An admin must set it under /admin/pricing before payment can be collected.",
      },
      { status: 404 },
    );
  }

  const currency = (pricing.currency as string).toLowerCase();
  const multiplier = SMALLEST_UNIT_MULTIPLIER[pricing.currency as string];
  if (!multiplier) {
    return NextResponse.json(
      { error: `Unsupported currency: ${pricing.currency}` },
      { status: 500 },
    );
  }
  const amount = Math.round(Number(pricing.price) * multiplier);

  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      description: pricing.item_name ?? "Professional Divination Course",
      metadata: {
        type: "diviner_signup",
        user_id: userId,
        email,
        name,
        item_key: COURSE_ITEM_KEY,
      },
    });

    return NextResponse.json(
      {
        client_secret: intent.client_secret,
        payment_intent_id: intent.id,
        amount,
        currency,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[diviner-signup/payment-intent] stripe error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create payment intent",
      },
      { status: 500 },
    );
  }
}
