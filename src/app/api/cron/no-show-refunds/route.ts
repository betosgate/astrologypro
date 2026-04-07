import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendRefundProcessed } from "@/lib/email";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron endpoint — processes no-show refunds for confirmed bookings
 * whose session window has closed.
 *
 * Rules (from platform no-show policy):
 *   - Diviner no-show (diviner_joined_at IS NULL after session end):
 *       → 100% refund to client
 *   - Client no-show (client_joined_at IS NULL after session end):
 *       → 50% refund to client (50% retained by diviner)
 *
 * This runs every 10 minutes via Vercel Cron (or any cron scheduler).
 * Secured by CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();

  // Find confirmed bookings whose session end time is at least 10 minutes ago
  // and have not been processed for no-show yet.
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: bookings, error } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, base_price, stripe_payment_intent_id, " +
      "diviner_joined_at, client_joined_at, refunded_at, " +
      "diviners(id, display_name, stripe_account_id), " +
      "clients(id, email, full_name)"
    )
    .eq("status", "confirmed")
    .is("no_show_processed_at", null)
    .not("stripe_payment_intent_id", "is", null) // skip $0 gift cert bookings
    .lte(
      // scheduled_at + duration_minutes < cutoff
      "scheduled_at",
      cutoff
    )
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[no-show-cron] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  const results: { bookingId: string; type: string | null; action: string }[] = [];

  for (const booking of bookings as unknown as Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number | null;
    base_price: number | null;
    stripe_payment_intent_id: string | null;
    diviner_joined_at: string | null;
    client_joined_at: string | null;
    refunded_at: string | null;
    diviners: { id: string; display_name: string | null; stripe_account_id: string | null } | null;
    clients: { id: string; email: string; full_name: string | null } | null;
  }>) {
    const sessionEndTime = new Date(
      new Date(booking.scheduled_at).getTime() +
        (booking.duration_minutes ?? 60) * 60 * 1000
    );

    // Skip if session hasn't ended yet (duration-aware cutoff)
    if (sessionEndTime.getTime() > Date.now() - 10 * 60 * 1000) {
      continue;
    }

    const divinerJoined = !!booking.diviner_joined_at;
    const clientJoined = !!booking.client_joined_at;
    const alreadyRefunded = !!booking.refunded_at;

    const diviner = booking.diviners as unknown as {
      id: string;
      display_name: string;
      stripe_account_id: string | null;
    } | null;

    const client = booking.clients as unknown as {
      id: string;
      email: string;
      full_name: string;
    } | null;

    const now = new Date().toISOString();

    // Both joined — legitimate session, just mark as processed
    if (divinerJoined && clientJoined) {
      await admin
        .from("bookings")
        .update({ no_show_processed_at: now })
        .eq("id", booking.id);
      results.push({ bookingId: booking.id, type: null, action: "no_action_both_joined" });
      processed++;
      continue;
    }

    // If booking was already refunded via another mechanism, just mark processed
    if (alreadyRefunded) {
      await admin
        .from("bookings")
        .update({ no_show_processed_at: now })
        .eq("id", booking.id);
      results.push({ bookingId: booking.id, type: null, action: "already_refunded" });
      processed++;
      continue;
    }

    let noShowType: "diviner" | "client" | null = null;
    let refundPercent = 0;
    let refundReason = "";

    if (!divinerJoined) {
      // Diviner no-show → 100% refund
      noShowType = "diviner";
      refundPercent = 100;
      refundReason = "Your diviner did not attend the scheduled session. Full refund issued automatically.";
    } else if (!clientJoined) {
      // Client no-show → 50% refund
      noShowType = "client";
      refundPercent = 50;
      refundReason = "You did not attend your scheduled session. A 50% refund has been issued per our No-Show Policy.";
    }

    if (noShowType === null) {
      await admin
        .from("bookings")
        .update({ no_show_processed_at: now })
        .eq("id", booking.id);
      continue;
    }

    const basePrice = booking.base_price as number;
    const refundAmount = Math.round(basePrice * (refundPercent / 100) * 100) / 100;
    const refundAmountCents = Math.round(refundAmount * 100);

    try {
      if (refundAmountCents > 0 && booking.stripe_payment_intent_id) {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: refundAmountCents,
          reason: "requested_by_customer",
          metadata: {
            booking_id: booking.id,
            no_show_type: noShowType,
            refund_percent: String(refundPercent),
          },
        });
      }

      await admin
        .from("bookings")
        .update({
          status: "no_show",
          no_show_type: noShowType,
          no_show_processed_at: now,
          refund_amount: refundAmount,
          refunded_at: now,
          refund_reason: refundReason,
        })
        .eq("id", booking.id);

      // Email the client
      if (client?.email && diviner?.display_name) {
        await sendRefundProcessed({
          clientEmail: client.email,
          divinerName: diviner.display_name,
          amount: refundAmount,
          reason: refundReason,
        }).catch((err) =>
          console.error("[no-show-cron] Email error:", err)
        );
      }

      results.push({
        bookingId: booking.id,
        type: noShowType,
        action: `refunded_${refundPercent}pct`,
      });
      processed++;
    } catch (err) {
      console.error("[no-show-cron] Refund error for booking", booking.id, err);
      results.push({
        bookingId: booking.id,
        type: noShowType,
        action: "error",
      });
    }
  }

  return NextResponse.json({ processed, results });
}
