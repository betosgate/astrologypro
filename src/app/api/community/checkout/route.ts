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
 *   upgrade_from_pm?: boolean   // true when the user currently has a PM subscription
 * }
 *
 * When upgrade_from_pm is true the current PM Stripe subscription is cancelled
 * immediately so the user is not double-charged.  The webhook then provisions
 * the Mystery School record after the new checkout completes.
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
      upgrade_from_pm = false,
    } = body as {
      membershipType: string;
      planType?: string;
      entry_quarter?: string;
      entry_year?: number;
      upgrade_from_pm?: boolean;
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

    // --- Cancel existing PM subscription if this is an upgrade ---
    if (isMysterySchool && upgrade_from_pm) {
      try {
        const admin = createAdminClient();
        const { data: existingMember } = await admin
          .from("community_members")
          .select("stripe_subscription_id, membership_type, membership_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (
          existingMember?.stripe_subscription_id &&
          existingMember.membership_type === "perennial_mandalism" &&
          existingMember.membership_status === "active"
        ) {
          // Cancel at period end so the member keeps access through the paid period.
          // The new MS subscription will become the authoritative billing record.
          await stripe.subscriptions.update(existingMember.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
        }
      } catch (cancelErr) {
        // Log but do not block checkout — the webhook / admin can clean up manually.
        console.error("[community/checkout] Failed to cancel PM subscription:", cancelErr);
      }
    }

    // --- Build Stripe line items ---
    let lineItems: Array<
      | { price: string; quantity: 1 }
      | { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: 1 }
    > = [];

    if (isMysterySchool) {
      const enrollmentPriceId = process.env.STRIPE_PRICE_MYSTERY_ENROLLMENT;
      const monthlyPriceId = process.env.STRIPE_PRICE_MYSTERY_MONTHLY;
      if (!enrollmentPriceId || !monthlyPriceId) {
        return NextResponse.json(
          { error: "Mystery School Stripe prices not configured." },
          { status: 500 }
        );
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
      metadata.upgrade_from_pm = String(upgrade_from_pm);
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      line_items: lineItems,
      metadata,
      success_url: `${APP_URL}/community?subscribed=true`,
      cancel_url: `${APP_URL}/community/upgrade`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[community/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
