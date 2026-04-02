import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { PRICING } from "@/lib/constants";
import { sendPhoneSessionReceipt } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Twilio status callback -- called when a call ends.
 * Calculates charges for phone readings and bills the client's saved card.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = parseInt(
      (formData.get("CallDuration") as string) || "0",
      10
    );

    if (callStatus !== "completed") {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();

    // Find the phone session by Twilio call SID
    const { data: session } = await supabase
      .from("phone_sessions")
      .select(
        "id, session_type, diviner_id, client_id, booking_id"
      )
      .eq("twilio_call_sid", callSid)
      .single();

    if (!session) {
      console.warn(`[Twilio Status] No phone session found for call ${callSid}`);
      return NextResponse.json({ ok: true });
    }

    const durationMinutes = Math.ceil(callDuration / 60);
    const platformCost = durationMinutes * PRICING.PHONE_COST_PER_MINUTE;

    // Calculate charge based on session type
    let amountCharged = 0;

    if (session.session_type === "standalone") {
      // Phone reading: $25 base for 20 min + $0.50/min after
      amountCharged = PRICING.PHONE_READING_BASE_PRICE;
      if (durationMinutes > PRICING.PHONE_READING_BASE_MINUTES) {
        const extraMinutes =
          durationMinutes - PRICING.PHONE_READING_BASE_MINUTES;
        amountCharged += extraMinutes * PRICING.PHONE_READING_OVERAGE_RATE;
      }
    }
    // For scheduled_dialin, no extra charge -- included in video session

    // Update the phone session record
    const now = new Date().toISOString();
    await supabase
      .from("phone_sessions")
      .update({
        ended_at: now,
        duration_seconds: callDuration,
        platform_cost: platformCost,
        amount_charged: amountCharged,
        status: "completed",
      })
      .eq("id", session.id);

    // Charge client if there's an amount
    if (amountCharged > 0 && session.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select(
          "stripe_customer_id, default_payment_method_id, email, display_name"
        )
        .eq("id", session.client_id)
        .single();

      if (
        client?.stripe_customer_id &&
        client?.default_payment_method_id
      ) {
        try {
          // Get diviner's connected Stripe account
          const { data: diviner } = await supabase
            .from("diviners")
            .select("stripe_account_id, display_name")
            .eq("id", session.diviner_id)
            .single();

          const amountInCents = Math.round(amountCharged * 100);
          const platformFee = Math.round(
            amountInCents * (PRICING.platformFeePercent / 100)
          );

          const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            customer: client.stripe_customer_id,
            payment_method: client.default_payment_method_id,
            off_session: true,
            confirm: true,
            description: `Phone reading - ${durationMinutes} minutes`,
            metadata: {
              phone_session_id: session.id,
              diviner_id: session.diviner_id,
              client_id: session.client_id,
            },
            ...(diviner?.stripe_account_id
              ? {
                  transfer_data: {
                    destination: diviner.stripe_account_id,
                    amount: amountInCents - platformFee,
                  },
                }
              : {}),
          });

          // Update the session with the payment intent
          await supabase
            .from("phone_sessions")
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq("id", session.id);

          // Send receipt email
          if (client.email) {
            await sendPhoneSessionReceipt({
              clientEmail: client.email,
              divinerName: diviner?.display_name ?? "Your Diviner",
              duration: durationMinutes,
              amount: amountCharged,
            }).catch((err) =>
              console.error("[Twilio Status] Failed to send receipt:", err)
            );
          }
        } catch (paymentError: any) {
          console.error(
            "[Twilio Status] Payment failed:",
            paymentError.message
          );

          // Mark the session as needing payment follow-up
          await supabase
            .from("phone_sessions")
            .update({ status: "failed" })
            .eq("id", session.id);

          // TODO: Queue email to client with manual payment link
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Twilio Status] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
