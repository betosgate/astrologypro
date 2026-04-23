import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDivinerBillingPortalSession } from "@/lib/stripe-saas";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

// ─── POST /api/dashboard/billing/portal ──────────────────────────────────────

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner record not found" }, { status: 404 });
  }

  if (!diviner.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription found. Redirecting to upgrade..." },
      { status: 400 }
    );
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      diviner.stripe_subscription_id
    );

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    if (!customerId) {
      return NextResponse.json(
        { error: "Could not resolve Stripe customer" },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
    const returnUrl = `${appUrl}/dashboard/settings?tab=account`;

    const url = await createDivinerBillingPortalSession(customerId, returnUrl);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[dashboard/billing/portal] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
