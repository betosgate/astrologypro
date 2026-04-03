import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Incoming call handler. Twilio sends form-encoded POST webhooks here when
 * someone calls a diviner's provisioned phone number.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;

    const supabase = createAdminClient();

    // 1. Look up diviner by To phone number
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id, phone_dialin_enabled, user_id")
      .eq("twilio_phone_number", to)
      .single();

    if (!diviner || !diviner.phone_dialin_enabled) {
      return twimlResponse(`
        <Response>
          <Say voice="alice">
            This number is not currently accepting calls.
            Please visit astrologypro.com to book a session.
          </Say>
          <Hangup/>
        </Response>
      `);
    }

    // 2. Look up client by From phone number
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", from)
      .maybeSingle();

    // 3. Check for active/upcoming bookings for this diviner+client
    if (client) {
      const now = new Date().toISOString();
      const windowEnd = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { data: booking } = await supabase
        .from("bookings")
        .select("id, scheduled_at, status, daily_room_name")
        .eq("diviner_id", diviner.id)
        .eq("client_id", client.id)
        .in("status", ["confirmed", "in_progress"])
        .gte("scheduled_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .lte("scheduled_at", windowEnd)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (booking && booking.daily_room_name) {
        // Scheduled session -- bridge into the Daily.co room via SIP
        await supabase.from("phone_sessions").insert({
          booking_id: booking.id,
          diviner_id: diviner.id,
          client_id: client.id,
          caller_phone: from,
          twilio_call_sid: callSid,
          daily_room_name: booking.daily_room_name,
          session_type: "scheduled_dialin",
          started_at: now,
          status: "active",
        });

        return twimlResponse(`
          <Response>
            <Say voice="alice">
              Connecting you to your reading session. This call will be recorded.
            </Say>
            <Dial>
              <Sip>sip:${booking.daily_room_name}@sip.daily.co</Sip>
            </Dial>
          </Response>
        `);
      }

      // Standalone call -- card-on-file billing not yet implemented
      if (false) { // TODO: re-enable when stripe_customer_id / default_payment_method_id added to clients
        await supabase
          .from("phone_sessions")
          .insert({
            diviner_id: diviner!.id,
            client_id: client!.id,
            caller_phone: from,
            twilio_call_sid: callSid,
            session_type: "standalone",
            started_at: now,
            status: "active",
          });

        // Trigger diviner notification (don't await — client must hear hold music immediately)
        const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice/notify`;
        fetch(notifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            diviner_id: diviner!.id,
            queue_name: `diviner-${diviner!.id}`,
            client_call_sid: callSid,
          }),
        }).catch(() => {}); // silent fail — client is already in queue

        return twimlResponse(`
          <Response>
            <Say voice="alice">
              Welcome to AstrologyPro. This is a phone reading session.
              You will be charged twenty-five dollars for the first twenty minutes,
              plus fifty cents per additional minute. This call will be recorded.
              Please hold while we connect you to your diviner.
            </Say>
            <Enqueue waitUrl="${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice/wait-music">
              diviner-${diviner!.id}
            </Enqueue>
          </Response>
        `);
      }
    }

    // Unknown caller or no card on file
    return twimlResponse(`
      <Response>
        <Say voice="alice">
          Thank you for calling AstrologyPro.
          To connect with your diviner, please book a session through astrologypro.com.
          You will need a payment method on file to use phone readings.
          Goodbye.
        </Say>
        <Hangup/>
      </Response>
    `);
  } catch (error) {
    console.error("[Twilio Incoming] Error:", error);
    return twimlResponse(`
      <Response>
        <Say voice="alice">
          We are experiencing technical difficulties. Please try again later or
          visit astrologypro.com to book your session.
        </Say>
        <Hangup/>
      </Response>
    `);
  }
}

function twimlResponse(twiml: string): NextResponse {
  return new NextResponse(twiml.trim(), {
    headers: { "Content-Type": "text/xml" },
  });
}
