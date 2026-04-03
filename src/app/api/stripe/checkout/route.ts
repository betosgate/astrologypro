import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { APP_URL } from "@/lib/constants";

export async function GET() {
  const sk = process.env.STRIPE_SECRET_KEY ?? "";
  return NextResponse.json({
    sk_prefix: sk ? sk.slice(0, 12) + "..." : "MISSING",
    sk_length: sk.length,
    STRIPE_PRICE_BOTH_SETUP: process.env.STRIPE_PRICE_BOTH_SETUP || "MISSING",
    STRIPE_PRICE_BOTH_MONTHLY: process.env.STRIPE_PRICE_BOTH_MONTHLY || "MISSING",
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || "MISSING",
  });
}

export async function POST(request: NextRequest) {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  let body: { email?: string; userId?: string; planId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, userId, planId } = body;

  if (!email || !userId || !planId) {
    return NextResponse.json({ error: "Missing email, userId, or planId" }, { status: 400 });
  }

  if (!PLANS[planId as PlanId]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planId as PlanId];
  const setupPriceId = process.env[plan.setupEnvKey];
  const monthlyPriceId = process.env[plan.monthlyEnvKey];

  if (!setupPriceId || !monthlyPriceId) {
    return NextResponse.json({
      error: `Stripe price IDs missing: ${plan.setupEnvKey}=${setupPriceId ?? "unset"}, ${plan.monthlyEnvKey}=${monthlyPriceId ?? "unset"}`
    }, { status: 500 });
  }

  try {
    const stripe = new Stripe(sk);
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: "subscription",
      line_items: [
        { price: setupPriceId, quantity: 1 },
        { price: monthlyPriceId, quantity: 1 },
      ],
      metadata: { userId, planId },
      success_url: `${APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/get-started?cancelled=true`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (error as any)?.raw;
    console.error("Stripe checkout error:", msg, raw);
    return NextResponse.json({ error: msg, raw }, { status: 500 });
  }
}
