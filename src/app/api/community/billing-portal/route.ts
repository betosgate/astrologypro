import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/billing-portal
 *
 * Creates a Stripe Customer Portal session for the authenticated community member
 * so they can manage their subscription (cancel, update payment method, etc.).
 *
 * Returns: { url: string }
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: member } = await admin
      .from("community_members")
      .select("id, membership_status, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (!member.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No Stripe subscription linked to this membership" },
        { status: 400 }
      );
    }

    // Retrieve the subscription to get the customer ID
    const subscription = await stripe.subscriptions.retrieve(
      member.stripe_subscription_id
    );

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

    if (!customerId) {
      return NextResponse.json(
        { error: "Could not resolve Stripe customer" },
        { status: 500 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/community`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[community/billing-portal] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
