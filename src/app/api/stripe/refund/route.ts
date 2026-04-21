import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";
import { recordRefundEvent } from "@/lib/refund-events";
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
import { createFinanceOperationNote } from "@/lib/finance-ops";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * Issue a refund for a completed booking.
 * Only the diviner who owns the booking or an admin can issue refunds.
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
    const adminUser = await getAdminUser();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // Verify diviner ownership unless the caller is an admin
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!diviner && !adminUser) {
      return NextResponse.json(
        { error: "Only diviners or admins can issue refunds" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select(
        "id, diviner_id, client_id, base_price, stripe_payment_intent_id, status, refunded_at, clients(email, full_name), diviners(display_name)"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!adminUser && booking.diviner_id !== diviner?.id) {
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
    // base_price is stored as dollars; Stripe expects cents
    const refundAmountDollars = booking.base_price as number;
    const refundAmountCents = Math.round(refundAmountDollars * 100);
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: refundAmountCents,
      reason: "requested_by_customer",
      metadata: {
        booking_id: bookingId,
        diviner_id: booking.diviner_id,
        refund_reason: reason ?? (adminUser ? "Admin-issued refund" : "Diviner-issued refund"),
      },
    });

    // Update booking record — store amount in dollars to match base_price
    const now = new Date().toISOString();
    await admin
      .from("bookings")
      .update({
        refund_amount: refundAmountDollars,
        refunded_at: now,
        refund_reason: reason ?? "Diviner-issued refund",
      })
      .eq("id", bookingId);

    const refundEvent = await recordRefundEvent({
      bookingId,
      divinerId: diviner.id,
      orderReference: `booking:${bookingId}`,
      paymentIntentId: booking.stripe_payment_intent_id,
      providerRefundId: refund.id,
      initiatedByUserId: user.id,
      initiatedByRole: adminUser ? "admin" : "diviner",
      amountCents: refundAmountCents,
      reason: reason ?? (adminUser ? "Admin-issued refund" : "Diviner-issued refund"),
      providerResponse: {
        refundStatus: refund.status,
        refundObject: refund.object,
      },
    });

    const reconciledEntry = await applyRefundToRevenueLedger({
      sourceType: "booking",
      sourceReference: `booking:${bookingId}`,
      refundAmountCents,
      refundEventId: refundEvent.id,
      actorUserId: user.id,
      actorRole: adminUser ? "admin" : "diviner",
      reason: reason ?? (adminUser ? "Admin-issued refund" : "Diviner-issued refund"),
    });

    await createFinanceOperationNote({
      createdByUserId: user.id,
      revenueLedgerEntryId: reconciledEntry.id,
      divinerId: booking.diviner_id,
      orderReference: `booking:${bookingId}`,
      noteType: "refund_investigation",
      note: reason ?? (adminUser ? "Admin-issued refund" : "Diviner-issued refund"),
      status: "resolved",
    });

    // Send refund email to client
    const clientData = booking.clients as any;
    const bookingDiviner = booking.diviners as { display_name?: string } | null;
    if (clientData?.email) {
      await sendRefundProcessed({
        clientEmail: clientData.email,
        divinerName: bookingDiviner?.display_name ?? diviner?.display_name ?? "Your Diviner",
        amount: refundAmountDollars,
        reason: reason ?? (adminUser ? "Refund issued by an admin" : "Refund issued by your diviner"),
      }).catch((err) =>
        console.error("[Refund] Failed to send refund email:", err)
      );
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmountDollars,
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
