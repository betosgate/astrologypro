import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getCheckoutSubscriptionId(session: Stripe.Checkout.Session): string | null {
  return typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;
}

export async function finalizeMysterySchoolCheckoutSession(
  session: Stripe.Checkout.Session
) {
  const admin = createAdminClient();
  const userId = session.metadata?.userId;
  const membershipType = session.metadata?.membershipType;
  const isResubscribe = session.metadata?.resubscribe === "true";

  if (!userId || membershipType !== "mystery_school") {
    throw new Error("Invalid Mystery School checkout session metadata.");
  }

  const {
    data: { user: authUser },
  } = await admin.auth.admin.getUserById(userId);

  if (!authUser) {
    throw new Error("Authenticated user could not be resolved for checkout session.");
  }

  const email = authUser.email ?? session.customer_email ?? "";
  const fullName = (authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    session.customer_details?.name ??
    null) as string | null;
  const subscriptionId = getCheckoutSubscriptionId(session);
  const enrollmentDate = new Date().toISOString();

  // Resubscribe path — the row already exists. Touch only the fields
  // that should change on reactivation. We must NOT overwrite the
  // original `enrolled_at`, `enrollment_date`, `training_status`,
  // `entry_quarter`/`entry_year`, or `one_time_fee_amount` — those
  // describe the original enrollment and the user's progress.
  if (isResubscribe) {
    const { data: student, error: updateError } = await admin
      .from("mystery_school_students")
      .update({
        stripe_subscription_id: subscriptionId,
        status: "active",
        paused_at: null,
        cancelled_at: null,
        access_expires_at: null,
      })
      .eq("user_id", userId)
      .select("id, user_id, stripe_subscription_id, status")
      .single();

    if (updateError || !student) {
      throw new Error("Failed to reactivate Mystery School student access.");
    }

    return { student };
  }

  const { data: existingMember } = await admin
    .from("community_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let communityMemberId = existingMember?.id ?? null;

  if (!communityMemberId) {
    const { data: newMember, error: memberError } = await admin
      .from("community_members")
      .insert({
        user_id: userId,
        email,
        full_name: fullName,
        membership_type: "mystery_school",
        membership_status: "active",
        plan_type: "individual",
        stripe_subscription_id: subscriptionId,
        joined_at: enrollmentDate,
      })
      .select("id")
      .single();

    if (memberError || !newMember) {
      throw new Error("Failed to create community membership for Mystery School checkout.");
    }

    communityMemberId = newMember.id;
  }

  const entryQuarter = session.metadata?.entry_quarter ?? null;
  const entryYear = session.metadata?.entry_year
    ? parseInt(session.metadata.entry_year, 10)
    : null;

  // Derive the one-time enrollment fee from the Stripe session itself
  // instead of hardcoding $97. amount_total is in the smallest currency unit
  // (cents for USD), so divide by 100. Falls back to 97 only when the
  // session somehow lacks an amount_total (defensive — completed checkouts
  // always have one).
  const oneTimeFeeAmount =
    typeof session.amount_total === "number" && session.amount_total > 0
      ? session.amount_total / 100
      : 97.0;

  const { data: student, error: studentError } = await admin
    .from("mystery_school_students")
    .upsert(
      {
        user_id: userId,
        community_member_id: communityMemberId,
        enrolled_at: enrollmentDate,
        enrollment_date: enrollmentDate,
        training_status: "foundation",
        entry_quarter: entryQuarter,
        entry_year: entryYear,
        stripe_subscription_id: subscriptionId,
        one_time_fee_paid: true,
        one_time_fee_amount: oneTimeFeeAmount,
        status: "active",
        paused_at: null,
        cancelled_at: null,
        access_expires_at: null,
      },
      { onConflict: "user_id" }
    )
    .select("id, user_id, stripe_subscription_id, status")
    .single();

  if (studentError || !student) {
    throw new Error("Failed to provision Mystery School student access.");
  }

  return {
    student,
  };
}
