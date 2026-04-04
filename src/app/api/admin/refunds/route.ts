import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";

export const runtime = "nodejs";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) return null;
  return user;
}

/**
 * GET /api/admin/refunds
 * Returns all bookings that have a Stripe payment intent, ordered by scheduled_at DESC.
 */
export async function GET() {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, base_price, refund_amount, refunded_at, refund_reason, status, no_show_type, stripe_payment_intent_id, clients(full_name, email), diviners(display_name)"
    )
    .not("stripe_payment_intent_id", "is", null)
    .order("scheduled_at", { ascending: false })
    .limit(500);

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
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
