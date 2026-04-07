import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/community/members/[id]/deactivate
 *
 * Admin action — deactivates a community member:
 * 1. Cancels their Stripe subscription at period end (if present).
 * 2. Sets community_members.membership_status = 'deactivated' and is_active = false.
 * 3. Logs the action to admin_activity_log.
 *
 * Path param: id — community_members.id (UUID)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid member id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Fetch the member ────────────────────────────────────────────────────────
  const { data: member, error: fetchError } = await admin
    .from("community_members")
    .select("id, user_id, full_name, email, membership_status, stripe_subscription_id")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json(
      { error: "Community member not found" },
      { status: 404 }
    );
  }

  if (member.membership_status === "deactivated") {
    return NextResponse.json(
      { error: "Member is already deactivated" },
      { status: 422 }
    );
  }

  // ── Cancel Stripe subscription at period end ────────────────────────────────
  let stripeError: string | null = null;
  if (member.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(member.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch (err: unknown) {
      // Non-fatal — log but continue with DB update
      stripeError =
        err instanceof Error ? err.message : "Stripe cancel failed";
      console.error(
        `[admin/community/members/${id}/deactivate] Stripe error:`,
        stripeError
      );
    }
  }

  // ── Update community_members ─────────────────────────────────────────────────
  const { error: updateError } = await admin
    .from("community_members")
    .update({
      membership_status: "deactivated",
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // ── Log to admin_activity_log ──────────────────────────────────────────────
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email ?? adminUser.id,
    target_user_id: member.user_id ?? null,
    action_type: "community_member_deactivated",
    details: {
      community_member_id: id,
      member_email: member.email,
      member_name: member.full_name,
      stripe_subscription_id: member.stripe_subscription_id ?? null,
      stripe_error: stripeError,
    },
  });

  return NextResponse.json({
    success: true,
    member_id: id,
    status: "deactivated",
    stripe_cancelled: member.stripe_subscription_id !== null && stripeError === null,
    stripe_error: stripeError,
  });
}
