import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/debug/reset-training
 * Resets all training progress and graduation status for the 
 * authenticated trainee. Only allowed for trainee1@test.astrologypro.com.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is trainee1@test.astrologypro.com
  if (user.email !== "trainee1@test.astrologypro.com") {
    return NextResponse.json(
      { error: "Forbidden: Only trainee1 can use this debug tool" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const email = user.email?.trim().toLowerCase() ?? null;

  const [{ data: traineeRow }, { data: divinerRow }] = await Promise.all([
    admin
      .from("trainees")
      .select("id, payment_intent_id, paid_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("diviners")
      .select("id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const { data: clientRows } = email
    ? await admin
        .from("clients")
        .select("id")
        .ilike("email", email)
    : { data: [] as Array<{ id: string }> };
  const clientIds = (clientRows ?? [])
    .map((client) => client.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const resetWarnings: string[] = [];

  const paymentIntentIds = new Set<string>();
  if (
    typeof traineeRow?.payment_intent_id === "string" &&
    traineeRow.payment_intent_id.trim().length > 0
  ) {
    paymentIntentIds.add(traineeRow.payment_intent_id.trim());
  }

  if (divinerRow?.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        divinerRow.stripe_subscription_id,
        { expand: ["latest_invoice.payment_intent"] },
      );

      const latestInvoice = subscription.latest_invoice as
        | { payment_intent?: string | { id?: string | null } | null }
        | null
        | undefined;
      const latestPaymentIntent = latestInvoice?.payment_intent;
      const latestPaymentIntentId =
        typeof latestPaymentIntent === "string"
          ? latestPaymentIntent
          : latestPaymentIntent?.id ?? null;

      if (latestPaymentIntentId) {
        paymentIntentIds.add(latestPaymentIntentId);
      }

      if (subscription.status !== "canceled") {
        await stripe.subscriptions.cancel(divinerRow.stripe_subscription_id);
      }
    } catch (error) {
      console.error("[reset-training] failed to cancel Stripe subscription:", error);
      resetWarnings.push("Could not cancel the recurring Stripe subscription.");
    }
  }

  for (const paymentIntentId of paymentIntentIds) {
    try {
      const existingRefunds = await stripe.refunds.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });

      if (existingRefunds.data.length === 0) {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
        });
      }
    } catch (error) {
      console.error("[reset-training] failed to refund payment intent:", paymentIntentId, error);
      resetWarnings.push(`Could not refund payment intent ${paymentIntentId}.`);
    }
  }

  // 1. Delete all completions and progress
  await Promise.all([
    admin.from("lesson_completions").delete().eq("user_id", user.id),
    admin.from("lesson_progress").delete().eq("user_id", user.id),
    admin.from("trainee_lesson_progress").delete().eq("user_id", user.id), // Just in case
    // trainee_tabbie_appointments history and records
    admin.from("trainee_tabbie_appointment_history").delete().eq("user_id", user.id),
    admin.from("trainee_tabbie_appointments").delete().eq("user_id", user.id),
    // Legacy bookings linked through clients.id
    ...(clientIds.length > 0
      ? [admin.from("bookings").delete().in("client_id", clientIds)]
      : []),
    // Admin calendar bookings linked directly by stored client email
    ...(email
      ? [admin.from("admin_bookings").delete().ilike("client_email", email)]
      : []),
  ]);

  // 2. Reset trainee fields
  const { error: traineeError } = await admin
    .from("trainees")
    .update({
      training_status: "active",
      graduated_at: null,
      certificate_code: null,
      tabbie_appointment_required: false,
      tabbie_appointment_status: "not_required",
      tabbie_appointment_completed: false,
      tabbie_appointment_completed_at: null,
      current_tabbie_appointment_id: null,
      tabbie_appointment_sync_status: null,
      tabbie_appointment_last_synced_at: null,
      tabbie_appointment_completion_source: null,
      tabbie_appointment_completion_notes: null,
      payment_intent_id: null,
      paid_at: null,
    })
    .eq("user_id", user.id);

  if (traineeError) {
    return NextResponse.json(
      { error: "Failed to reset trainee status", message: traineeError.message },
      { status: 500 }
    );
  }

  // Execute cleanup operations sequentially to avoid deadlocks in tables with foreign keys/correlations
  const roleCleanupTables = [
    { table: "diviners", filter: { user_id: user.id } },
    { table: "clients", filter: { user_id: user.id } },
    { table: "social_advocates", filter: { user_id: user.id } },
    { table: "community_members", filter: { user_id: user.id } },
    { table: "mystery_school_students", filter: { user_id: user.id } },
    { table: "user_contract_requirements", filter: { user_id: user.id } },
    { table: "legal_acceptances", filter: { user_id: user.id } },
    { table: "signed_agreement_artifacts", filter: { user_id: user.id } },
  ];

  for (const op of roleCleanupTables) {
    const { error: opError } = await admin.from(op.table).delete().match(op.filter);
    if (opError) {
      console.error(`[reset-training] Failed to clean ${op.table}:`, opError);
      return NextResponse.json(
        {
          error: `Failed to remove ${op.table} record during cleanup`,
          message: opError.message,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Training progress and extra portal roles reset successfully",
    warnings: resetWarnings,
  });
}
