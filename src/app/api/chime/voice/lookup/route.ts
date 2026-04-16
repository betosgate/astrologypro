import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeAttendee } from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/lookup
 * Called by the SMA Lambda to resolve caller → diviner → booking.
 * Returns the action the SMA should take (join_meeting, enqueue, or reject).
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: shared secret from SMA Lambda
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callerPhone, calledNumber, callId } = await request.json();

    if (!callerPhone || !calledNumber) {
      return NextResponse.json(
        { error: "Missing callerPhone or calledNumber" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Look up diviner by their Chime phone number
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, phone_provider, phone_mobile, phone_answer_mode")
      .eq("chime_phone_number", calledNumber)
      .single();

    if (!diviner || diviner.phone_provider !== "chime") {
      return NextResponse.json(
        { error: "Diviner not found or Chime not enabled" },
        { status: 404 }
      );
    }

    // 2. Look up client by caller phone
    const { data: client } = await admin
      .from("clients")
      .select("id, stripe_customer_id, default_payment_method_id")
      .eq("phone", callerPhone)
      .maybeSingle();

    // 3. Check for scheduled booking (within 15 min before to 30 min after)
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    if (client) {
      const { data: booking } = await admin
        .from("bookings")
        .select("id, chime_meeting_id, video_provider, status")
        .eq("diviner_id", diviner.id)
        .eq("client_id", client.id)
        .gte("scheduled_at", windowStart)
        .lte("scheduled_at", windowEnd)
        .not("status", "in", '("cancelled","no_show","completed")')
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      // Scheduled dial-in: join the Chime meeting
      if (
        booking &&
        booking.chime_meeting_id &&
        booking.video_provider === "chime"
      ) {
        // Create an attendee for the phone caller
        const attendee = await createChimeAttendee(
          booking.chime_meeting_id,
          `phone-${callerPhone}`
        );

        // Create phone_sessions record
        const { data: phoneSession } = await admin
          .from("phone_sessions")
          .insert({
            booking_id: booking.id,
            diviner_id: diviner.id,
            client_id: client.id,
            caller_phone: callerPhone,
            session_type: "scheduled_dialin",
            phone_provider: "chime",
            chime_meeting_id: booking.chime_meeting_id,
            started_at: new Date().toISOString(),
            status: "active",
          })
          .select("id")
          .single();

        return NextResponse.json({
          action: "join_meeting",
          chimeMeetingId: booking.chime_meeting_id,
          joinToken: attendee.joinToken,
          attendeeId: attendee.attendeeId,
          phoneSessionId: phoneSession?.id,
        });
      }

      // Standalone call: client has card on file
      if (client.stripe_customer_id && client.default_payment_method_id) {
        const { data: phoneSession } = await admin
          .from("phone_sessions")
          .insert({
            diviner_id: diviner.id,
            client_id: client.id,
            caller_phone: callerPhone,
            session_type: "standalone",
            phone_provider: "chime",
            started_at: new Date().toISOString(),
            status: "active",
          })
          .select("id")
          .single();

        return NextResponse.json({
          action: "enqueue",
          divinerId: diviner.id,
          phoneSessionId: phoneSession?.id,
          phone_answer_mode: diviner.phone_answer_mode ?? "both",
          phone_mobile: diviner.phone_mobile ?? null,
        });
      }
    }

    // TODO: Remove test bypass before production launch
    // Temporary: allow call through even without booking/card for testing
    {
      const { data: phoneSession } = await admin
        .from("phone_sessions")
        .insert({
          diviner_id: diviner.id,
          client_id: client?.id ?? null,
          caller_phone: callerPhone,
          session_type: "standalone",
          phone_provider: "chime",
          started_at: new Date().toISOString(),
          status: "active",
        })
        .select("id")
        .single();

      return NextResponse.json({
        action: "enqueue",
        divinerId: diviner.id,
        phoneSessionId: phoneSession?.id,
        phone_answer_mode: diviner.phone_answer_mode ?? "both",
        phone_mobile: diviner.phone_mobile ?? null,
      });
    }
  } catch (error) {
    console.error("Chime voice lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
