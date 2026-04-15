import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

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

    const { data: student } = await admin
      .from("mystery_school_students")
      .select("id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "No Mystery School subscription found" },
        { status: 404 }
      );
    }

    if (!student.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No Stripe subscription linked to this Mystery School access" },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(
      student.stripe_subscription_id
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
      return_url: `${APP_URL}/mystery-school`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[mystery-school/billing-portal] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
