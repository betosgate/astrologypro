import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/billing/unsubscribe
 *
 * Cancels the authenticated community member's Stripe subscription at the end
 * of the current billing period (no immediate revocation).
 *
 * Replaces the legacy `unsubscribe-stripe-Perennial` endpoint and lets the
 * dashboard handle the confirmation modal in-page instead of redirecting to
 * the Stripe Customer Portal.
 *
 * Returns: { ok: true, cancel_at_period_end: true }
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

    // Object-level authorization: only the row owner (already checked via
    // `eq('user_id', user.id)`) can cancel this specific subscription.
    const updated = await stripe.subscriptions.update(
      member.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Optionally reflect cancellation intent in our DB so the dashboard can
    // show "Cancelling" immediately without waiting for the webhook.
    await admin
      .from("community_members")
      .update({ membership_status: "cancelling" })
      .eq("id", member.id);

    return NextResponse.json({
      ok: true,
      cancel_at_period_end: updated.cancel_at_period_end,
    });
  } catch (err) {
    console.error("[community/billing/unsubscribe] POST error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
