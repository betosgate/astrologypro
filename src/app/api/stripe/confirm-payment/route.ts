import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/confirm-payment
 *
 * Called by the booking wizard frontend after Stripe.confirmPayment() succeeds.
 * Acts as a webhook fallback — verifies the payment with Stripe and updates
 * the booking + order status if payment is confirmed.
 *
 * This is idempotent: if the webhook already processed the payment, this is a no-op.
 *
 * Body: { paymentIntentId: string; bookingId: string }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    paymentIntentId?: string;
    bookingId?: string;
  };

  if (!body.paymentIntentId || !body.bookingId) {
    return NextResponse.json(
      { error: "paymentIntentId and bookingId are required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch the booking
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, diviner_id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp")
    .eq("id", body.bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Already confirmed — nothing to do
  if (booking.status === "confirmed" || booking.status === "completed") {
    return NextResponse.json({
      confirmed: true,
      status: booking.status,
      message: "Already confirmed",
    });
  }

  // Verify payment intent matches the booking
  if (
    booking.stripe_payment_intent_id &&
    booking.stripe_payment_intent_id !== body.paymentIntentId
  ) {
    return NextResponse.json(
      { error: "Payment intent does not match booking" },
      { status: 400 }
    );
  }

  // Verify payment with Stripe
  let paymentIntent;
  try {
    // Try platform-level lookup first
    paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
  } catch {
    // Try connected account lookup
    try {
      const { data: diviner } = await admin
        .from("diviners")
        .select("stripe_account_id")
        .eq("id", booking.diviner_id)
        .maybeSingle();

      if (diviner?.stripe_account_id) {
        paymentIntent = await stripe.paymentIntents.retrieve(
          body.paymentIntentId,
          { stripeAccount: diviner.stripe_account_id }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Could not verify payment with Stripe" },
        { status: 502 }
      );
    }
  }

  if (!paymentIntent) {
    return NextResponse.json(
      { error: "Payment intent not found" },
      { status: 404 }
    );
  }

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json({
      confirmed: false,
      paymentStatus: paymentIntent.status,
      message: `Payment status is "${paymentIntent.status}"`,
    });
  }

  // Payment confirmed — update booking status
  await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", body.bookingId)
    .in("status", ["pending", "pending_payment"]);

  // Update order status from pending_payment to paid
  await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("booking_id", body.bookingId)
    .eq("status", "pending_payment");

  // ── Affiliate Attribution Fallback ──
  // Idempotent: safe to run even if webhook beats this to it.
  try {
    if (
      booking.commission_source_assignment_id ||
      booking.commission_source_template_id
    ) {
      const { creditAffiliateConversion } = await import("@/lib/affiliate-attribution");
      const amountCents = Number(booking.total_amount ?? booking.base_price ?? 0) * 100;

      await creditAffiliateConversion(admin, {
        bookingId: booking.id,
        orderAmountCents: Math.round(amountCents),
        refCode: (booking.ref_code as string | null) ?? null,
        stampedAssignmentId: (booking.commission_source_assignment_id as string | null) ?? null,
        stampedTemplateId: (booking.commission_source_template_id as string | null) ?? null,
        stampedRateType: (booking.commission_rate_type_stamp as "percent" | "flat" | null) ?? null,
        stampedRateValue: booking.commission_rate_value_stamp != null ? Number(booking.commission_rate_value_stamp) : null,
      });
      console.log(`[confirm-payment] Affiliate fallback sync completed for bookingId=${booking.id}`);
    }
  } catch (err) {
    console.error("[confirm-payment] Affiliate conversion credit failed", { bookingId: booking.id, err });
  }

  console.log(
    `[confirm-payment] Payment verified and booking confirmed: bookingId=${body.bookingId}, paymentIntent=${body.paymentIntentId}`
  );

  return NextResponse.json({
    confirmed: true,
    status: "confirmed",
    message: "Payment verified and booking confirmed",
  });
}
