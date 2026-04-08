import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";

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
      "id, scheduled_at, base_price, refund_amount, refunded_at, refund_reason, status, no_show_type, stripe_payment_intent_id, clients(full_name, email), diviners(display_name)"
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

  return NextResponse.json({ rows: rows ?? [] });
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
      "id, base_price, stripe_payment_intent_id, refunded_at, clients(email, full_name), diviners(display_name)"
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
