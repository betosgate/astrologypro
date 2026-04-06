import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendPhonePaymentFailed } from "@/lib/email";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/charge-confirmed-sessions
 * Runs hourly. Charges clients 24h after their session was confirmed.
 * Requires both diviner and client to have joined (confirmed_at IS NOT NULL).
 * Uses client's Stripe default_payment_method_id (card on file).
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Find confirmed sessions older than 24h that haven't been billed yet
  const { data: bookings, error } = await admin
    .from("bookings")
    .select(
      `id, base_price, confirmed_at, stripe_customer_id,
       clients(id, email, full_name, default_payment_method_id, stripe_customer_id),
       diviners(id, display_name)`
    )
    .not("confirmed_at", "is", null)
    .lte("confirmed_at", cutoff)
    .or("billing_status.is.null,billing_status.eq.pending")
    .is("billed_at", null)
    .limit(50);

  if (error) {
    console.error("[charge-confirmed-sessions] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let billed = 0;
  let failed = 0;
  let skipped = 0;

  for (const booking of bookings ?? []) {
    const clientData = (booking.clients as unknown) as {
      id: string;
      email: string;
      full_name: string | null;
      default_payment_method_id: string | null;
      stripe_customer_id: string | null;
    } | null;

    const divinerData = (booking.diviners as unknown) as { display_name: string | null } | null;

    // Skip if no payment method on file
    if (!clientData?.default_payment_method_id || !clientData?.stripe_customer_id) {
      await admin
        .from("bookings")
        .update({ billing_status: "skipped", billed_at: now.toISOString() })
        .eq("id", booking.id);

      await admin.from("billing_events").insert({
        booking_id: booking.id,
        client_id: clientData?.id ?? null,
        amount: Number(booking.base_price),
        status: "skipped",
        failure_message: "No default payment method on file",
      });

      skipped++;
      continue;
    }

    const amountCents = Math.round(Number(booking.base_price) * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        customer: clientData.stripe_customer_id,
        payment_method: clientData.default_payment_method_id,
        confirm: true,
        off_session: true,
        description: `AstrologyPro session — ${divinerData?.display_name ?? "Diviner"}`,
        metadata: {
          booking_id: booking.id,
          client_id: clientData.id,
          billing_type: "card_on_file_24h",
        },
      });

      await admin
        .from("bookings")
        .update({
          billing_status: "billed",
          billed_at: now.toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq("id", booking.id);

      await admin.from("billing_events").insert({
        booking_id: booking.id,
        client_id: clientData.id,
        amount: Number(booking.base_price),
        stripe_pi_id: paymentIntent.id,
        stripe_pm_id: clientData.default_payment_method_id,
        status: "succeeded",
      });

      billed++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown charge error";
      console.error("[charge-confirmed-sessions] charge failed:", message, booking.id);

      await admin
        .from("bookings")
        .update({ billing_status: "failed" })
        .eq("id", booking.id);

      await admin.from("billing_events").insert({
        booking_id: booking.id,
        client_id: clientData.id,
        amount: Number(booking.base_price),
        stripe_pm_id: clientData.default_payment_method_id,
        status: "failed",
        failure_message: message,
      });

      // Notify client to update payment method
      if (clientData.email) {
        await sendPhonePaymentFailed({
          clientEmail: clientData.email,
          divinerName: divinerData?.display_name ?? "Your Diviner",
          duration: 60,
          amount: Number(booking.base_price),
          divinerPageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
        }).catch((e) =>
          console.error("[charge-confirmed-sessions] email error:", e)
        );
      }

      failed++;
    }
  }

  console.log(
    `[charge-confirmed-sessions] billed=${billed} failed=${failed} skipped=${skipped}`
  );

  return NextResponse.json({ billed, failed, skipped });
}
