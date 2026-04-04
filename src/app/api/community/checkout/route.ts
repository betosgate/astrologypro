import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

/**
 * POST /api/community/checkout
 * Creates a Stripe Checkout session for community membership.
 *
 * Plans:
 *   - perennial_mandalism individual: $9.97/month (STRIPE_PRICE_COMMUNITY_INDIVIDUAL)
 *   - perennial_mandalism family:     $19.97/month (STRIPE_PRICE_COMMUNITY_FAMILY)
 *   - mystery_school:                 $97 one-time + $27/month
 *       (STRIPE_PRICE_MYSTERY_ENROLLMENT + STRIPE_PRICE_MYSTERY_MONTHLY)
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

    const { membershipType, planType } = await request.json();

    if (!["perennial_mandalism", "mystery_school"].includes(membershipType)) {
      return NextResponse.json({ error: "Invalid membership type" }, { status: 400 });
    }

    const isMysterySchool = membershipType === "mystery_school";
    const isFamily = planType === "family" && !isMysterySchool;

    // Determine Stripe price IDs
    let lineItems: { price: string; quantity: 1 }[] = [];

    if (isMysterySchool) {
      const enrollmentPriceId = process.env.STRIPE_PRICE_MYSTERY_ENROLLMENT;
      const monthlyPriceId = process.env.STRIPE_PRICE_MYSTERY_MONTHLY;
      if (!enrollmentPriceId || !monthlyPriceId) {
        return NextResponse.json({ error: "Mystery School Stripe prices not configured." }, { status: 500 });
      }
      lineItems = [
        { price: enrollmentPriceId, quantity: 1 },
        { price: monthlyPriceId, quantity: 1 },
      ];
    } else {
      const priceId = isFamily
        ? process.env.STRIPE_PRICE_COMMUNITY_FAMILY
        : process.env.STRIPE_PRICE_COMMUNITY_INDIVIDUAL;
      if (!priceId) {
        return NextResponse.json({ error: "Community Stripe price not configured." }, { status: 500 });
      }
      lineItems = [{ price: priceId, quantity: 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      line_items: lineItems,
      metadata: {
        type: "community",
        userId: user.id,
        membershipType,
        planType: isFamily ? "family" : "individual",
      },
      success_url: `${APP_URL}/community?subscribed=true`,
      cancel_url: `${APP_URL}/join/community`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[community/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
