import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeAttendee } from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/lookup
 * Called by the SMA Lambda to resolve caller → diviner → booking.
 * Returns the action the SMA should take (join_meeting, enqueue, or reject).
 *
 * Two routing modes:
 *
 *  1. LEGACY (per-diviner number): called with { callerPhone, calledNumber, callId }.
 *     Looks up the diviner by their dedicated chime_phone_number and finds a
 *     booking within a ±15/30 minute window. Unchanged from before.
 *
 *  2. CENTRAL + PIN (new, shared number): called with { callPin, callerPhone?, callId }.
 *     Routes the call by 6-digit PIN alone. Returns one of:
 *       • { action: "join_meeting", ... }           — booking active + chime meeting
 *       • { action: "enqueue", ... }                — booking active, dial diviner mobile
 *       • { action: "play_and_retry_pin", ... }     — invalid PIN, Lambda may retry
 *       • { action: "play_and_hangup", reason, ... }— terminal voice message + hang up
 *
 *     The SMA Lambda owns attempt counting for invalid_pin; the API is stateless.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: shared secret from SMA Lambda
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { callerPhone, calledNumber, callId, callPin } = body as {
      callerPhone?: string;
      calledNumber?: string;
      callId?: string;
      callPin?: string;
    };

    const admin = createAdminClient();

    // ─── Mode 2: CENTRAL + PIN ─────────────────────────────────────
    if (callPin !== undefined && callPin !== null) {
      return await handlePinLookup(admin, {
        callPin,
        callerPhone: callerPhone ?? null,
        callId: callId ?? null,
      });
    }

    // ─── Mode 1: LEGACY per-diviner number ──────────────────────────
    if (!callerPhone || !calledNumber) {
      return NextResponse.json(
        { error: "Missing callerPhone or calledNumber" },
        { status: 400 }
      );
    }

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

      // Client has a booking in the window — enqueue as standalone phone call
      if (booking) {
        const { data: phoneSession } = await admin
          .from("phone_sessions")
          .insert({
            booking_id: booking.id,
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

    // No client found or no booking — reject the call
    if (!client) {
      console.log("Caller not found in clients table:", callerPhone);
      return NextResponse.json(
        { error: "No account found for this phone number. Please book a session online first." },
        { status: 404 }
      );
    }

    // Client found but no booking in window
    console.log("No upcoming booking found for client:", client.id, "and diviner:", diviner.id);
    return NextResponse.json(
      { error: "No upcoming booking found. Please book a session before calling." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Chime voice lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════════════════════════════
//  PIN-based lookup (new, shared-number mode)
// ══════════════════════════════════════════════════════════════════════

type AdminClient = ReturnType<typeof createAdminClient>;

async function handlePinLookup(
  admin: AdminClient,
  { callPin, callerPhone, callId }: {
    callPin: string;
    callerPhone: string | null;
    callId: string | null;
  }
) {
  // Normalize + validate: must be exactly 6 digits.
  const pin = (callPin ?? "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({
      action: "play_and_retry_pin",
      reason: "invalid_pin",
      message: "Incorrect PIN, please try again.",
    });
  }

  // Look up by PIN. We deliberately do not scope by status here so we can
  // return a specific "booking already used" / "cancelled" message.
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, status, chime_meeting_id, video_provider, diviner_id, client_id"
    )
    .eq("call_pin", pin)
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({
      action: "play_and_retry_pin",
      reason: "invalid_pin",
      message: "Incorrect PIN, please try again.",
    });
  }

  // Terminal booking states → play message + hang up (no retry).
  if (booking.status === "completed") {
    return NextResponse.json({
      action: "play_and_hangup",
      reason: "booking_consumed",
      message:
        "This booking has already been used. Please book a new session at astrologypro.com.",
    });
  }
  if (booking.status === "canceled" || booking.status === "no_show") {
    return NextResponse.json({
      action: "play_and_hangup",
      reason: "booking_cancelled",
      message:
        "This booking has been cancelled. Please book a new session at astrologypro.com.",
    });
  }

  // Future / past window gate.
  // The PIN is valid and the booking is active — is the call time okay?
  const startTime = new Date(booking.scheduled_at);
  const durationMs = (booking.duration_minutes ?? 0) * 60 * 1000;
  const endTime = new Date(startTime.getTime() + durationMs);
  const now = new Date();

  // 10-minute early grace, 15-minute late grace. Matches spec §3.2.
  const EARLY_GRACE_MS = 10 * 60 * 1000;
  const LATE_GRACE_MS = 15 * 60 * 1000;

  const activeWindowStart = new Date(startTime.getTime() - EARLY_GRACE_MS);
  const activeWindowEnd = new Date(endTime.getTime() + LATE_GRACE_MS);

  if (now < activeWindowStart) {
    return NextResponse.json({
      action: "play_and_hangup",
      reason: "booking_future",
      message: `Your meeting is scheduled for ${formatSpokenDate(startTime)}. Please call back at that time.`,
    });
  }

  if (now > activeWindowEnd) {
    return NextResponse.json({
      action: "play_and_hangup",
      reason: "booking_past",
      message:
        "This booking has already ended. Please book a new session at astrologypro.com.",
    });
  }

  // Happy path — booking is active. Look up diviner + client and route.
  const [{ data: diviner }, { data: client }] = await Promise.all([
    admin
      .from("diviners")
      .select("id, phone_provider, phone_mobile, phone_answer_mode")
      .eq("id", booking.diviner_id)
      .single(),
    booking.client_id
      ? admin
          .from("clients")
          .select("id")
          .eq("id", booking.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: { id: string } | null }),
  ]);

  if (!diviner) {
    return NextResponse.json({
      action: "play_and_hangup",
      reason: "booking_cancelled",
      message:
        "We could not locate the diviner for this booking. Please contact support.",
    });
  }

  // Booking has a Chime meeting → join it.
  if (booking.chime_meeting_id && booking.video_provider === "chime") {
    const attendee = await createChimeAttendee(
      booking.chime_meeting_id,
      `phone-${callerPhone ?? callId ?? "unknown"}`
    );

    const { data: phoneSession } = await admin
      .from("phone_sessions")
      .insert({
        booking_id: booking.id,
        diviner_id: diviner.id,
        client_id: client?.id ?? null,
        caller_phone: callerPhone ?? null,
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

  // Standalone phone-call routing → dial the diviner's mobile.
  const { data: phoneSession } = await admin
    .from("phone_sessions")
    .insert({
      booking_id: booking.id,
      diviner_id: diviner.id,
      client_id: client?.id ?? null,
      caller_phone: callerPhone ?? null,
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

/**
 * Human-readable date string for the "your meeting is at X" voice prompt.
 * AWS Chime PlayAudio expects pre-recorded audio; AWS Chime Speak (Polly)
 * accepts text. The SMA Lambda will pass this string to Speak.
 *
 * Uses en-US with the server's default timezone. If we later want to
 * localize to the client's timezone, extend the API request body to
 * include a tz hint resolved from the booking.
 */
function formatSpokenDate(d: Date): string {
  try {
    return d.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d.toISOString();
  }
}
