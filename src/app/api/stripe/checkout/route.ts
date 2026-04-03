import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/billing";
import { PLANS, type PlanId } from "@/lib/plans";
import { APP_URL } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0, 12) + "..." : "MISSING",
    STRIPE_PRICE_TAROT_SETUP: process.env.STRIPE_PRICE_TAROT_SETUP || "MISSING",
    STRIPE_PRICE_TAROT_MONTHLY: process.env.STRIPE_PRICE_TAROT_MONTHLY || "MISSING",
    STRIPE_PRICE_BOTH_SETUP: process.env.STRIPE_PRICE_BOTH_SETUP || "MISSING",
    STRIPE_PRICE_BOTH_MONTHLY: process.env.STRIPE_PRICE_BOTH_MONTHLY || "MISSING",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, userId, planId } = await request.json();

    if (!email || !userId || !planId) {
      return NextResponse.json(
        { error: "Missing email, userId, or planId" },
        { status: 400 }
      );
    }

    if (!PLANS[planId as PlanId]) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

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
