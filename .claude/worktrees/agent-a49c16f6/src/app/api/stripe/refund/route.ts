import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Issue a refund for a completed booking.
 * Only the diviner who owns the booking can issue refunds.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, reason } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // Verify diviner ownership
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id, display_name")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Only diviners can issue refunds" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select(
        "id, diviner_id, client_id, amount, stripe_payment_intent_id, status, refunded_at, clients(email, display_name)"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.diviner_id !== diviner.id) {
      return NextResponse.json(
        { error: "You can only refund your own bookings" },
        { status: 403 }
      );
    }

    if (booking.refunded_at) {
      return NextResponse.json(
        { error: "This booking has already been refunded" },
        { status: 400 }
      );
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment found for this booking" },
        { status: 400 }
      );
    }

    // Issue the refund via Stripe
    const refundAmount = booking.amount; // full refund in cents
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: refundAmount,
      reason: "requested_by_customer",
      metadata: {
        booking_id: bookingId,
        diviner_id: diviner.id,
        refund_reason: reason ?? "Diviner-issued refund",
      },
    });

    // Update booking record
    const now = new Date().toISOString();
    await admin
      .from("bookings")
      .update({
        refund_amount: refundAmount / 100, // store as dollars
        refunded_at: now,
        refund_reason: reason ?? "Diviner-issued refund",
      })
      .eq("id", bookingId);

    // Send refund email to client
    const clientData = booking.clients as any;
    if (clientData?.email) {
      await sendRefundProcessed({
        clientEmail: clientData.email,
        divinerName: diviner.display_name ?? "Your Diviner",
        amount: refundAmount / 100,
        reason: reason ?? "Refund issued by your diviner",
      }).catch((err) =>
        console.error("[Refund] Failed to send refund email:", err)
      );
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmount / 100,
    });
  } catch (error) {
    console.error("[Stripe Refund] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process refund",
      },
      { status: 500 }
    );
  }
}
