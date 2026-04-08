import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/billing/setup-intent
 *
 * Creates a Stripe SetupIntent for the authenticated community member so they
 * can update their payment method in-page using Stripe Elements.
 *
 * Returns: { clientSecret: string }
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

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    console.error("[community/billing/setup-intent] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
