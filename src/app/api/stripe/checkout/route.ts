import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/billing";
import { APP_URL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Missing email or userId" },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession({
      email,
      userId,
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
