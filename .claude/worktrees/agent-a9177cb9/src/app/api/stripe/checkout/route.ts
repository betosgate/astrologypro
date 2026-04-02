import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/billing";
import { PLANS, type PlanId } from "@/lib/plans";
import { APP_URL } from "@/lib/constants";

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

    const session = await createCheckoutSession({
      email,
      userId,
      planId: planId as PlanId,
      successUrl: `${APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_URL}/get-started?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
