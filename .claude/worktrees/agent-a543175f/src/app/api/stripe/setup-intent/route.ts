import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

/**
 * Create a Stripe SetupIntent for a client to save a payment method.
 * Creates a Stripe Customer if one doesn't exist yet.
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

    // Find the client record
    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("id, stripe_customer_id, email, display_name")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client account not found" },
        { status: 404 }
      );
    }

    let stripeCustomerId = client.stripe_customer_id;

    // Create Stripe Customer if not exists
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email ?? user.email ?? undefined,
        name: client.display_name ?? undefined,
        metadata: {
          client_id: client.id,
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      await admin
        .from("clients")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", client.id);
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      metadata: {
        client_id: client.id,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    });
  } catch (error) {
    console.error("[Stripe SetupIntent] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create setup intent",
      },
      { status: 500 }
    );
  }
}
