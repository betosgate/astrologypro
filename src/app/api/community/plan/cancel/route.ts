import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * POST /api/community/plan/cancel
 *
 * Sets cancel_at_period_end=true on the Stripe subscription so the member
 * retains access until the current billing period ends, then their membership
 * is cancelled automatically via the customer.subscription.deleted webhook.
 *
 * Updates community_members.membership_status to 'cancelling' so the UI
 * can surface the pending-cancel state without removing access.
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

    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select("id, stripe_subscription_id, membership_status, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (member.membership_status === "cancelled") {
      return NextResponse.json(
        { error: "Membership is already cancelled" },
        { status: 422 }
      );
    }

    if (member.membership_status === "cancelling") {
      return NextResponse.json(
        { error: "Cancellation is already scheduled for the end of the billing period" },
        { status: 422 }
      );
    }

    let currentPeriodEnd = member.current_period_end;

    // Update Stripe subscription if one exists
    if (member.stripe_subscription_id) {
      const updated = await stripe.subscriptions.update(
        member.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      const updatedAny = updated as unknown as { current_period_end?: number };
      if (updatedAny.current_period_end) {
        currentPeriodEnd = new Date(
          updatedAny.current_period_end * 1000
        ).toISOString();
      }
    }

    // Mark as cancelling in DB — access remains until period end
    const { error: updateError } = await admin
      .from("community_members")
      .update({
        membership_status: "cancelling",
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "cancelling",
      current_period_end: currentPeriodEnd,
    });
  } catch (err) {
    console.error("[community/plan/cancel] POST error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
