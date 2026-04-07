import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/checkout
 * Creates a Stripe Checkout session for community membership.
 *
 * Plans:
 *   - perennial_mandalism individual: $9.97/month (STRIPE_PRICE_COMMUNITY_INDIVIDUAL)
 *   - perennial_mandalism family:     $19.97/month (STRIPE_PRICE_COMMUNITY_FAMILY)
 *   - mystery_school:                 $97 one-time + $27/month
 *       (STRIPE_PRICE_MYSTERY_ENROLLMENT + STRIPE_PRICE_MYSTERY_MONTHLY)
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
 * The webhook provisions mystery_school_students as the MS entitlement;
 * community_members continues to track PM membership separately.
 *
 * When the admin PM-discount toggle is enabled and the user is an active PM
 * member, the discounted monthly price (STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT)
 * is used instead of the standard price.
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

    // --- Build Stripe line items ---
    let lineItems: Array<
      | { price: string; quantity: 1 }
      | { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: 1 }
    > = [];

    if (isMysterySchool) {
      const enrollmentPriceId = process.env.STRIPE_PRICE_MYSTERY_ENROLLMENT;
      const standardMonthlyPriceId = process.env.STRIPE_PRICE_MYSTERY_MONTHLY;
      const discountMonthlyPriceId = process.env.STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT;
      if (!enrollmentPriceId || !standardMonthlyPriceId) {
        return NextResponse.json(
          { error: "Mystery School Stripe prices not configured." },
          { status: 500 }
        );
      }

      // Determine if PM-discount applies: user must be active PM member AND
      // admin toggle must be enabled AND the discount price must be configured.
      let monthlyPriceId = standardMonthlyPriceId;

      if (discountMonthlyPriceId) {
        const admin = createAdminClient();

        // Check both conditions in parallel
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
          monthlyPriceId = discountMonthlyPriceId;
        }
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
        return NextResponse.json(
          { error: "Community Stripe price not configured." },
          { status: 500 }
        );
      }
      lineItems = [{ price: priceId, quantity: 1 }];
    }

    // --- Build metadata ---
    const metadata: Record<string, string> = {
      type: "community",
      userId: user.id,
      membershipType,
      planType: isFamily ? "family" : "individual",
    };

    if (isMysterySchool && entry_quarter && entry_year) {
      metadata.entry_quarter = entry_quarter;
      metadata.entry_year = String(entry_year);
    }

    // Route success/cancel URLs to the correct portal context
    const successUrl = isMysterySchool
      ? `${APP_URL}/mystery-school?subscribed=true`
      : `${APP_URL}/community?subscribed=true`;
    const cancelUrl = isMysterySchool
      ? `${APP_URL}/mystery-school/enroll`
      : `${APP_URL}/community/upgrade`;

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
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
