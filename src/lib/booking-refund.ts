import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";
import { recordRefundEvent } from "@/lib/refund-events";
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
import { createFinanceOperationNote } from "@/lib/finance-ops";

/**
 * Shared booking-refund pipeline used by every cancel/refund surface
 * (diviner dashboard, admin, client email link, trainee dashboard).
 *
 * Guarantees:
 *   - Idempotent: a second call for the same booking returns
 *     `alreadyRefunded=true` with the prior amount/date instead of
 *     creating a duplicate Stripe refund.
 *   - Stripe-level idempotency via `idempotency_key: booking-refund-{id}`
 *     so concurrent or retried callers can't double-refund either.
 *   - Fire-and-forget: ledger/finance/email operations run inside a
 *     try/catch so a downstream failure (e.g. email outage) cannot
 *     undo a successful Stripe refund.
 */

export type RefundInitiatorRole = "admin" | "diviner" | "system";

export interface IssueBookingRefundParams {
  bookingId: string;
  initiatedByUserId: string | null;
  initiatedByRole: RefundInitiatorRole;
  reason?: string;
}

export interface IssueBookingRefundResult {
  /** True when a new Stripe refund was just created. */
  issued: boolean;
  /** True when the booking was already refunded before this call. */
  alreadyRefunded: boolean;
  /** True when the booking has no payment eligible for refund. */
  noPayment: boolean;
  refundAmount: number | null;
  refundedAt: string | null;
  refundReason: string | null;
  refundId: string | null;
  error: string | null;
}

export async function issueBookingRefund({
  bookingId,
  initiatedByUserId,
  initiatedByRole,
  reason,
}: IssueBookingRefundParams): Promise<IssueBookingRefundResult> {
  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select(
      "id, diviner_id, base_price, stripe_payment_intent_id, refund_amount, refunded_at, refund_reason, clients(email, full_name), diviners(display_name)"
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return {
      issued: false,
      alreadyRefunded: false,
      noPayment: false,
      refundAmount: null,
      refundedAt: null,
      refundReason: null,
      refundId: null,
      error: "Booking not found",
    };
  }

  // Already refunded → return the prior refund details verbatim so callers
  // can surface "already cancelled and refunded" without duplicating work.
  if (booking.refunded_at) {
    return {
      issued: false,
      alreadyRefunded: true,
      noPayment: false,
      refundAmount: (booking.refund_amount as number | null) ?? (booking.base_price as number | null) ?? null,
      refundedAt: booking.refunded_at as string,
      refundReason: (booking.refund_reason as string | null) ?? null,
      refundId: null,
      error: null,
    };
  }

  const paymentIntentId = booking.stripe_payment_intent_id as string | null;
  const basePrice = (booking.base_price as number | null) ?? 0;

  if (!paymentIntentId || basePrice <= 0) {
    return {
      issued: false,
      alreadyRefunded: false,
      noPayment: true,
      refundAmount: null,
      refundedAt: null,
      refundReason: null,
      refundId: null,
      error: null,
    };
  }

  const refundAmountDollars = basePrice;
  const refundAmountCents = Math.round(refundAmountDollars * 100);
  const resolvedReason =
    reason ??
    (initiatedByRole === "admin"
      ? "Admin-issued refund"
      : initiatedByRole === "diviner"
        ? "Diviner-issued refund"
        : "Booking cancellation refund");

  let refundId: string | null = null;
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: refundAmountCents,
        reason: "requested_by_customer",
        metadata: {
          booking_id: bookingId,
          diviner_id: (booking.diviner_id as string | null) ?? "",
          refund_reason: resolvedReason,
          initiated_by_role: initiatedByRole,
        },
      },
      { idempotencyKey: `booking-refund-${bookingId}` }
    );
    refundId = refund.id;
  } catch (stripeError) {
    const message =
      stripeError instanceof Error ? stripeError.message : "Stripe refund failed";
    return {
      issued: false,
      alreadyRefunded: false,
      noPayment: false,
      refundAmount: null,
      refundedAt: null,
      refundReason: null,
      refundId: null,
      error: message,
    };
  }

  const refundedAt = new Date().toISOString();
  await admin
    .from("bookings")
    .update({
      refund_amount: refundAmountDollars,
      refunded_at: refundedAt,
      refund_reason: resolvedReason,
    })
    .eq("id", bookingId);

  // Ledger + finance ops + client email — best-effort; a Stripe refund
  // should not be rolled back because a downstream insert failed.
  try {
    const refundEvent = await recordRefundEvent({
      bookingId,
      divinerId: (booking.diviner_id as string | null) ?? null,
      orderReference: `booking:${bookingId}`,
      paymentIntentId,
      providerRefundId: refundId,
      initiatedByUserId,
      initiatedByRole,
      amountCents: refundAmountCents,
      reason: resolvedReason,
      providerResponse: { refundId },
    });

    const reconciledEntry = await applyRefundToRevenueLedger({
      sourceType: "booking",
      sourceReference: `booking:${bookingId}`,
      refundAmountCents,
      refundEventId: refundEvent.id,
      actorUserId: initiatedByUserId,
      actorRole: initiatedByRole,
      reason: resolvedReason,
    });

    if (initiatedByUserId) {
      await createFinanceOperationNote({
        createdByUserId: initiatedByUserId,
        revenueLedgerEntryId: reconciledEntry.id,
        divinerId: (booking.diviner_id as string | null) ?? null,
        orderReference: `booking:${bookingId}`,
        noteType: "refund_investigation",
        note: resolvedReason,
        status: "resolved",
      });
    }
  } catch (ledgerError) {
    console.error("[issueBookingRefund] ledger/finance error:", ledgerError);
  }

  try {
    const clientRecord = booking.clients as { email?: string | null } | null;
    const divinerRecord = booking.diviners as { display_name?: string | null } | null;
    if (clientRecord?.email) {
      await sendRefundProcessed({
        clientEmail: clientRecord.email,
        divinerName: divinerRecord?.display_name ?? "Your Diviner",
        amount: refundAmountDollars,
        reason: resolvedReason,
      });
    }
  } catch (emailError) {
    console.error("[issueBookingRefund] email error:", emailError);
  }

  return {
    issued: true,
    alreadyRefunded: false,
    noPayment: false,
    refundAmount: refundAmountDollars,
    refundedAt,
    refundReason: resolvedReason,
    refundId,
    error: null,
  };
}
