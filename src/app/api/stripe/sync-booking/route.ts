import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/sync-booking
 * Verify a Stripe payment intent and sync the booking status.
 * Called by the diviner dashboard when a booking appears stuck in "pending".
 * Body: { booking_id: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { booking_id?: string };
  if (!body.booking_id) {
    return NextResponse.json({ error: "booking_id is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const adminUser = await getAdminUser();

  // Fetch the booking — allow the owning diviner or any admin
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner && !adminUser) {
    return NextResponse.json({ error: "Diviner account not found" }, { status: 403 });
  }

  let bookingQuery = admin
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp, affiliate_commission_amount_cents, diviner_id")
    .eq("id", body.booking_id);

  if (!adminUser && diviner) {
    bookingQuery = bookingQuery.eq("diviner_id", diviner.id);
  }

  const { data: booking } = await bookingQuery.maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // If already confirmed, nothing to do
  if (booking.status === "confirmed" || booking.status === "completed") {
    return NextResponse.json({ synced: false, status: booking.status, message: "Already confirmed" });
  }

  // Free bookings can be confirmed directly
  if (!booking.stripe_payment_intent_id || Number(booking.base_price ?? 0) <= 0) {
    await admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking.id);

    // ── Affiliate Attribution Fallback (Free Bookings) ──
    try {
      if (booking.commission_source_assignment_id || booking.commission_source_template_id) {
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
          stampedCommissionCents:
            (booking as Record<string, unknown>).affiliate_commission_amount_cents != null
              ? Number(
                  (booking as Record<string, unknown>).affiliate_commission_amount_cents,
                )
              : null,
        });
      }
    } catch (err) {
      console.error("[sync-booking] Affiliate conversion credit failed", { bookingId: booking.id, err });
    }

    return NextResponse.json({ synced: true, status: "confirmed", message: "Free booking confirmed" });
  }

  // Verify payment intent status with Stripe
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id, {
      stripeAccount: undefined, // platform-level lookup
    });
  } catch {
    // Try connected account lookup
    try {
      const { data: divinerRecord } = await admin
        .from("diviners")
        .select("stripe_account_id")
        .eq("id", booking.diviner_id)
        .single();
      if (divinerRecord?.stripe_account_id) {
        paymentIntent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id,
          { stripeAccount: divinerRecord.stripe_account_id }
        );
      }
    } catch {
      return NextResponse.json({ error: "Could not retrieve payment from Stripe" }, { status: 502 });
    }
  }

  if (!paymentIntent) {
    return NextResponse.json({ error: "Payment intent not found" }, { status: 404 });
  }

  if (paymentIntent.status === "succeeded") {
    // Payment confirmed — update booking and order
    await admin
      .from("bookings")
      .update({
        status: "confirmed",
        stripe_payment_status: "paid",
      })
      .eq("id", booking.id);

    // Update order if exists
    await admin
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("booking_id", booking.id)
      .eq("status", "pending_payment");

    // ── Affiliate Attribution Fallback (Paid Bookings) ──
    try {
      if (booking.commission_source_assignment_id || booking.commission_source_template_id) {
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
          stampedCommissionCents:
            (booking as Record<string, unknown>).affiliate_commission_amount_cents != null
              ? Number(
                  (booking as Record<string, unknown>).affiliate_commission_amount_cents,
                )
              : null,
        });
      }
    } catch (err) {
      console.error("[sync-booking] Affiliate conversion credit failed", { bookingId: booking.id, err });
    }

    return NextResponse.json({ synced: true, status: "confirmed", message: "Payment verified and booking confirmed" });
  }

  return NextResponse.json({
    synced: false,
    status: booking.status,
    paymentStatus: paymentIntent.status,
    message: `Payment status is "${paymentIntent.status}" — booking not confirmed`,
  });
}
