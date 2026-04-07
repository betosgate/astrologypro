import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * POST /api/community/plan/uncancel
 *
 * Reverses a pending cancellation (cancel_at_period_end=false) before the
 * billing period ends. Only valid when membership_status is 'cancelling'.
 *
 * Sets membership_status back to 'active'.
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
      .select("id, stripe_subscription_id, membership_status")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (member.membership_status !== "cancelling") {
      return NextResponse.json(
        { error: "No pending cancellation to reverse" },
        { status: 422 }
      );
    }

    // Reverse cancel_at_period_end in Stripe
    if (member.stripe_subscription_id) {
      await stripe.subscriptions.update(member.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
    }

    // Restore active status
    const { error: updateError } = await admin
      .from("community_members")
      .update({
        membership_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ status: "active" });
  } catch (err) {
    console.error("[community/plan/uncancel] POST error:", err);
    return NextResponse.json(
      { error: "Failed to reverse cancellation" },
      { status: 500 }
    );
  }
}
