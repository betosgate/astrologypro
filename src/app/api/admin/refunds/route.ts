import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";
import { recordRefundEvent } from "@/lib/refund-events";
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
import { createFinanceOperationNote, logFinanceAdminAction } from "@/lib/finance-ops";

export const runtime = "nodejs";


export const dynamic = "force-dynamic";

/**
 * GET /api/admin/refunds
 * Returns all bookings that have a Stripe payment intent, ordered by scheduled_at DESC.
 * Supports ?created_from=YYYY-MM-DD&created_to=YYYY-MM-DD date filters on scheduled_at.
 */
export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const createdFrom = sp.get("created_from") ?? "";
  const createdTo = sp.get("created_to") ?? "";

  const admin = createAdminClient();

  let query = admin
    .from("bookings")
    .select(
      "id, scheduled_at, base_price, refund_amount, refunded_at, refund_reason, status, no_show_type, stripe_payment_intent_id, clients(full_name, email), diviners(id, display_name)"
    )
    .not("stripe_payment_intent_id", "is", null)
    .order("scheduled_at", { ascending: false })
    .limit(500);

  if (createdFrom) query = query.gte("scheduled_at", createdFrom);
  if (createdTo) query = query.lte("scheduled_at", createdTo + "T23:59:59");

  const { data: rows, error } = await query;

  if (error) {
    console.error("[Admin Refunds] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookings = rows ?? [];
  if (bookings.length === 0) {
    return NextResponse.json({ rows: [] });
  }

  const orderRefs = bookings.map((row) => `booking:${row.id}`);
  const bookingIds = bookings.map((row) => row.id as string);

  const [{ data: ledgerRows }, { data: affiliateRows }, { data: noteRows }] =
    await Promise.all([
    admin
      .from("revenue_ledger_entries")
      .select(
        "id, source_reference, settlement_status, settlement_note, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_net_amount_cents, refunded_gross_amount_cents, refunded_platform_fee_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents"
      )
      .eq("source_type", "booking")
      .in("source_reference", orderRefs),
    // Post System A: ledger is campaign_conversions. `refunded` bucket
    // is `reversed_at IS NOT NULL`. No per-conversion partial-refund
    // tracking in Phase 1 — a conversion is either fully earned or
    // fully reversed.
    admin
      .from("campaign_conversions")
      .select("booking_id, commission_amount_cents, reversed_at")
      .in("booking_id", bookingIds),
    admin
      .from("finance_operation_notes")
      .select("order_reference, note_type, note, created_at")
      .in("order_reference", orderRefs)
      .order("created_at", { ascending: false }),
    ]);

  const ledgerMap = new Map(
    (ledgerRows ?? []).map((row) => [row.source_reference, row]),
  );
  const affiliateMap = new Map<string, { total: number; refunded: number }>();
  const noteMap = new Map<
    string,
    { noteType: string; note: string; createdAt: string } | undefined
  >();
  for (const row of affiliateRows ?? []) {
    const bookingId = row.booking_id as string | null;
    if (!bookingId) continue;
    const key = `booking:${bookingId}`;
    const existing = affiliateMap.get(key) ?? { total: 0, refunded: 0 };
    const cents = Number(row.commission_amount_cents ?? 0);
    existing.total += cents / 100;
    if (row.reversed_at) existing.refunded += cents / 100;
    affiliateMap.set(key, existing);
  }
  for (const row of noteRows ?? []) {
    const key = row.order_reference as string | null;
    if (!key || noteMap.has(key)) continue;
    noteMap.set(key, {
      noteType: String(row.note_type ?? "general"),
      note: String(row.note ?? ""),
      createdAt: String(row.created_at ?? ""),
    });
  }

  return NextResponse.json({
    rows: bookings.map((row) => {
      const ref = `booking:${row.id}`;
      const ledger = ledgerMap.get(ref);
      const affiliate = affiliateMap.get(ref);
      const latestNote = noteMap.get(ref);
      return {
        ...row,
        ledger_gross_amount: Number(ledger?.gross_amount_cents ?? 0) / 100,
        ledger_platform_fee: Number(ledger?.platform_fee_cents ?? 0) / 100,
        ledger_affiliate_commission: Number(ledger?.affiliate_commission_cents ?? 0) / 100,
        ledger_diviner_net: Number(ledger?.diviner_net_amount_cents ?? 0) / 100,
        ledger_remaining_gross_amount:
          (Number(ledger?.gross_amount_cents ?? 0) -
            Number(ledger?.refunded_gross_amount_cents ?? 0)) /
          100,
        ledger_remaining_platform_fee:
          (Number(ledger?.platform_fee_cents ?? 0) -
            Number(ledger?.refunded_platform_fee_cents ?? 0)) /
          100,
        ledger_remaining_affiliate_commission:
          (Number(ledger?.affiliate_commission_cents ?? 0) -
            Number(ledger?.refunded_affiliate_commission_cents ?? 0)) /
          100,
        ledger_remaining_diviner_net:
          (Number(ledger?.diviner_net_amount_cents ?? 0) -
            Number(ledger?.refunded_diviner_net_amount_cents ?? 0)) /
          100,
        settlement_status: ledger?.settlement_status ?? null,
        settlement_note: ledger?.settlement_note ?? null,
        affiliate_refund_amount: affiliate?.refunded ?? 0,
        finance_note_type: latestNote?.noteType ?? null,
        finance_note: latestNote?.note ?? null,
      };
    }),
  });
}

/**
 * POST /api/admin/refunds
 * Issue a full refund for a booking (admin override — no ownership check).
 */
export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, reason } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select(
      "id, diviner_id, base_price, stripe_payment_intent_id, refunded_at, clients(email, full_name), diviners(display_name)"
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.refunded_at) {
    return NextResponse.json(
      { error: "Already refunded" },
      { status: 400 }
    );
  }

  if (!booking.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "No Stripe payment on this booking" },
      { status: 400 }
    );
  }

  const amountCents = Math.round(Number(booking.base_price) * 100);

  const refund = await stripe.refunds.create({
    payment_intent: booking.stripe_payment_intent_id,
    amount: amountCents,
    reason: "requested_by_customer",
    metadata: {
      booking_id: bookingId,
      issued_by: user.email ?? "admin",
      refund_reason: reason ?? "Admin-issued refund",
    },
  });

  const now = new Date().toISOString();
  await admin
    .from("bookings")
    .update({
      refund_amount: Number(booking.base_price),
      refunded_at: now,
      refund_reason: reason ?? "Admin-issued refund",
      status: "refunded",
    })
    .eq("id", bookingId);

  const refundEvent = await recordRefundEvent({
    bookingId,
    divinerId: booking.diviner_id ?? null,
    orderReference: `booking:${bookingId}`,
    paymentIntentId: booking.stripe_payment_intent_id,
    providerRefundId: refund.id,
    initiatedByUserId: user.id,
    initiatedByRole: "admin",
    amountCents,
    reason: reason ?? "Admin-issued refund",
    providerResponse: {
      refundStatus: refund.status,
      refundObject: refund.object,
    },
  });

  const reconciledEntry = await applyRefundToRevenueLedger({
    sourceType: "booking",
    sourceReference: `booking:${bookingId}`,
    refundAmountCents: amountCents,
    refundEventId: refundEvent.id,
    actorUserId: user.id,
    actorRole: "admin",
    reason: reason ?? "Admin-issued refund",
  });

  await createFinanceOperationNote({
    createdByUserId: user.id,
    revenueLedgerEntryId: reconciledEntry.id,
    divinerId: booking.diviner_id ?? null,
    orderReference: `booking:${bookingId}`,
    noteType: "refund_investigation",
    note: reason ?? "Admin-issued refund",
    status: "resolved",
  });

  await logFinanceAdminAction({
    adminUserId: user.id,
    targetUserId: booking.diviner_id ?? null,
    actionType: "finance_refund_issued",
    details: {
      bookingId,
      amountCents,
      refundId: refund.id,
      settlementStatus: reconciledEntry.settlement_status,
    },
  });

  const clientData = booking.clients as { email?: string; full_name?: string } | null;
  const divinerData = booking.diviners as { display_name?: string } | null;
  if (clientData?.email) {
    await sendRefundProcessed({
      clientEmail: clientData.email,
      divinerName: divinerData?.display_name ?? "your diviner",
      amount: Number(booking.base_price),
      reason: reason ?? "Admin-issued refund",
    }).catch((err) =>
      console.error("[Admin Refund] email error:", err)
    );
  }

  return NextResponse.json({ success: true, refundId: refund.id });
}
