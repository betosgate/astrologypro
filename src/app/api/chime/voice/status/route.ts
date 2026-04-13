import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING } from "@/lib/constants";
import { syncTelephonyUsageFromPhoneSession } from "@/lib/telephony-billing";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/status
 * Called by the SMA Lambda handler when a call completes.
 * Mirrors /api/twilio/voice/status — handles billing for standalone calls.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is from our SMA Lambda (shared secret)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      phoneSessionId,
      callStatus,
      durationSeconds,
      chimeMeetingId,
      chimeTransactionId,
    } = body as {
      phoneSessionId?: string;
      callStatus?: string;
      durationSeconds?: number;
      chimeMeetingId?: string;
      chimeTransactionId?: string;
    };

    if (!phoneSessionId || callStatus !== "completed" || !durationSeconds) {
      return NextResponse.json({ ok: true }); // Ignore non-completion events
    }

    const admin = createAdminClient();

    // Find the phone session
    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, session_type, diviner_id, client_id")
      .eq("id", phoneSessionId)
      .single();

    if (!session) {
      console.error("Chime voice status: phone session not found:", phoneSessionId);
      return NextResponse.json({ ok: true });
    }

    const durationMinutes = Math.ceil(durationSeconds / 60);

    // Calculate platform cost (Chime PSTN rate)
    const CHIME_COST_PER_MINUTE = 0.002; // $0.002/min for Chime PSTN
    const platformCost = Math.round(durationMinutes * CHIME_COST_PER_MINUTE * 100) / 100;

    let amountCharged = 0;

    if (session.session_type === "standalone") {
      // Standalone call billing: $25 base for 20 min + $0.50/min overage
      const basePrice = PRICING.PHONE_READING_BASE_PRICE;
      const baseMinutes = PRICING.PHONE_READING_BASE_MINUTES;
      const overageMinutes = Math.max(0, durationMinutes - baseMinutes);
      amountCharged = basePrice + overageMinutes * PRICING.PHONE_READING_OVERAGE_RATE;

      // Charge client via Stripe (card on file)
      if (session.client_id) {
        const { data: client } = await admin
          .from("clients")
          .select("stripe_customer_id, default_payment_method_id")
          .eq("id", session.client_id)
          .single();

        if (client?.stripe_customer_id && client?.default_payment_method_id) {
          try {
            const stripe = (await import("stripe")).default;
            const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

            // Get diviner's connected account for transfer
            const { data: diviner } = await admin
              .from("diviners")
              .select("stripe_account_id")
              .eq("id", session.diviner_id)
              .single();

            const platformFee = Math.round(amountCharged * (PRICING.platformFeePercent / 100) * 100);

            const paymentIntent = await stripeClient.paymentIntents.create({
              amount: Math.round(amountCharged * 100),
              currency: "usd",
              customer: client.stripe_customer_id,
              payment_method: client.default_payment_method_id,
              off_session: true,
              confirm: true,
              metadata: {
                type: "chime_phone_session",
                phoneSessionId,
                phone_session_id: phoneSessionId,
                divinerId: session.diviner_id,
                durationMinutes: durationMinutes.toString(),
              },
              ...(diviner?.stripe_account_id
                ? {
                    transfer_data: {
                      destination: diviner.stripe_account_id,
                    },
                    application_fee_amount: platformFee,
                  }
                : {}),
            });

            // Update session with payment info
            await admin
              .from("phone_sessions")
              .update({
                stripe_payment_intent_id: paymentIntent.id,
              })
              .eq("id", phoneSessionId);
          } catch (err) {
            console.error("Chime phone session: payment failed:", err);
            await admin
              .from("phone_sessions")
              .update({ status: "failed" })
              .eq("id", phoneSessionId);

            // Send payment failure email
            try {
              const { sendPhonePaymentFailed } = await import("@/lib/email");
              const { data: clientData } = await admin
                .from("clients")
                .select("email, full_name")
                .eq("id", session.client_id)
                .single();
              const { data: divinerData } = await admin
                .from("diviners")
                .select("display_name, username")
                .eq("id", session.diviner_id)
                .single();
              if (clientData?.email) {
                await sendPhonePaymentFailed({
                  clientEmail: clientData.email,
                  divinerName: divinerData?.display_name ?? "Your Reader",
                  duration: durationMinutes,
                  amount: amountCharged,
                  divinerPageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${divinerData?.username ?? ""}`,
                });
              }
            } catch {
              // Non-blocking
            }

            return NextResponse.json({ ok: true });
          }
        }
      }
    }

    // Update phone_sessions record
    await admin
      .from("phone_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        platform_cost: platformCost,
        amount_charged: amountCharged,
        status: "completed",
        chime_meeting_id: chimeMeetingId ?? null,
        chime_transaction_id: chimeTransactionId ?? null,
      })
      .eq("id", phoneSessionId);

    await syncTelephonyUsageFromPhoneSession(phoneSessionId).catch((err) =>
      console.error("Chime voice status: failed to sync telephony usage:", err)
    );

    // Send receipt email for standalone calls
    if (session.session_type === "standalone" && amountCharged > 0 && session.client_id) {
      try {
        const { sendPhoneSessionReceipt } = await import("@/lib/email");
        const { data: clientData } = await admin
          .from("clients")
          .select("email")
          .eq("id", session.client_id)
          .single();
        const { data: divinerData } = await admin
          .from("diviners")
          .select("display_name")
          .eq("id", session.diviner_id)
          .single();
        if (clientData?.email) {
          await sendPhoneSessionReceipt({
            clientEmail: clientData.email,
            divinerName: divinerData?.display_name ?? "Your Reader",
            duration: durationMinutes,
            amount: amountCharged,
          });
        }
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Chime voice status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
