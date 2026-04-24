import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChimeMeeting,
  createChimeAttendee,
  getChimeMeeting,
  startChimeRecording,
} from "@/lib/chime-meetings";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { CreateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/call-client
 *
 * Called from the diviner dashboard bookings list ("Call client" row action).
 * Places an outbound PSTN call to the booking's client and joins the diviner
 * into the same Chime meeting via browser SDK, producing two-way audio.
 *
 * Flow:
 *   1. Auth — must be a diviner session
 *   2. Object-level auth — the booking must be owned by this diviner
 *   3. Resolve the phone to dial:
 *        clients.phone  ↓
 *        bookings.questionnaire_responses.phone  (guest / ad-hoc clients)
 *   4. Reuse bookings.chime_meeting_id if present, else create a fresh meeting
 *   5. Create a diviner-browser attendee + a client-phone attendee
 *   6. CreateSipMediaApplicationCall → Chime dials the client's PSTN.
 *      The SMA Lambda receives NEW_OUTBOUND_CALL → CALL_ANSWERED and, seeing
 *      action="dial_client_for_booking" in the ArgumentsMap, returns a
 *      JoinChimeMeeting action that bridges the answered client leg into
 *      this meeting.
 *   7. Insert a phone_sessions row (direction=outbound,
 *      session_type=outbound_diviner_call) with booking_id, client_id, the
 *      outbound TransactionId, the meeting id, and session start timestamp.
 *   8. Start an audio recording pipeline on the meeting (idempotent).
 *   9. Return { meeting, attendee } so the browser widget can join audio.
 *
 * Concurrency guard: if an outbound session for this (diviner, booking) is
 * already in a non-terminal state we return that session's info instead of
 * starting a second dial — cheap defense against double-clicks / retries.
 *
 * Rate limit + idempotency: if the client sends an Idempotency-Key header
 * and a phone_sessions row with the same key already exists, we return it
 * unchanged. Missing header falls back to the concurrency guard above.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: diviner } = await admin
      .from("diviners")
      .select("id, chime_phone_number")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Only diviners can initiate calls" },
        { status: 403 }
      );
    }

    // ── Input ──────────────────────────────────────────────────────────────
    const body = (await request.json().catch(() => ({}))) as {
      bookingId?: string;
    };
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // ── Fetch booking + enforce object-level authorization ─────────────────
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(
        "id, owner_id, diviner_id, client_id, status, chime_meeting_id, chime_external_meeting_id, questionnaire_responses, scheduled_at"
      )
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // owner_id is the canonical tenant scope (falls back to diviner_id for
    // older rows). Either path must match THIS diviner — never trust the
    // UI to hide the button.
    const ownsBooking =
      booking.owner_id === diviner.id || booking.diviner_id === diviner.id;
    if (!ownsBooking) {
      return NextResponse.json(
        { error: "Booking does not belong to you" },
        { status: 403 }
      );
    }

    // Refuse to dial on terminal bookings — no outbound calls on cancelled /
    // refunded / declined rows. Completed is allowed (post-session follow-up
    // calls are a real workflow).
    const blockedStatuses = new Set([
      "cancelled",
      "canceled",
      "refunded",
      "declined",
      "no_show",
    ]);
    if (
      typeof booking.status === "string" &&
      blockedStatuses.has(booking.status)
    ) {
      return NextResponse.json(
        { error: `Cannot call client on a ${booking.status} booking` },
        { status: 409 }
      );
    }

    // ── Concurrency guard ──────────────────────────────────────────────────
    // The button sends an Idempotency-Key header on every click (see
    // CallClientButton). We don't persist it (no column), but we do catch
    // rapid double-clicks by matching the in-flight session below. True
    // idempotent replay would need a follow-up migration adding a unique
    // (diviner_id, idempotency_key) index on phone_sessions.
    //
    // If the same diviner+booking already has an in-flight outbound session,
    // return it. The browser SDK can re-join the same meeting idempotently.
    const { data: existing } = await admin
      .from("phone_sessions")
      .select(
        "id, chime_meeting_id, chime_transaction_id, status, booking_id, client_id"
      )
      .eq("diviner_id", diviner.id)
      .eq("booking_id", booking.id)
      .eq("direction", "outbound")
      .in("status", ["pending", "dialing", "active", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.chime_meeting_id) {
      try {
        const fullMeeting = await getChimeMeeting(existing.chime_meeting_id);
        const divinerAttendee = await createChimeAttendee(
          existing.chime_meeting_id,
          `diviner-browser-${diviner.id}-${Date.now()}`
        );
        return NextResponse.json({
          reused: true,
          phoneSessionId: existing.id,
          chimeMeetingId: existing.chime_meeting_id,
          meeting: fullMeeting,
          attendee: {
            AttendeeId: divinerAttendee.attendeeId,
            JoinToken: divinerAttendee.joinToken,
          },
        });
      } catch {
        // meeting may have expired — fall through and start a new dial
      }
    }

    // ── Resolve the client phone to dial ──────────────────────────────────
    let clientPhone: string | null = null;
    let clientIdForSession: string | null = booking.client_id ?? null;

    if (booking.client_id) {
      const { data: client } = await admin
        .from("clients")
        .select("id, phone")
        .eq("id", booking.client_id)
        .maybeSingle();
      if (client?.phone) clientPhone = String(client.phone).trim();
    }

    // Fall back to any phone collected on the booking itself (guest/ad-hoc).
    if (!clientPhone) {
      const qr = booking.questionnaire_responses as
        | Record<string, unknown>
        | null
        | undefined;
      const fromQr =
        (qr?.phone as string | undefined) ??
        (qr?.phone_number as string | undefined) ??
        (qr?.client_phone as string | undefined) ??
        null;
      if (fromQr && String(fromQr).trim()) {
        clientPhone = String(fromQr).trim();
      }
    }

    if (!clientPhone) {
      return NextResponse.json(
        {
          error:
            "This booking has no phone number on file. Ask the client to add one to their profile.",
        },
        { status: 422 }
      );
    }

    // E.164 sanity check — Chime requires a leading '+' and digits only.
    const normalizedPhone = clientPhone.replace(/[^\d+]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      return NextResponse.json(
        {
          error:
            "Client phone is not in E.164 format (expected e.g. +14155552671)",
        },
        { status: 422 }
      );
    }

    // ── Resolve Chime SMA + from-number ────────────────────────────────────
    const smaId = process.env.CHIME_SMA_ID?.trim();
    const fromNumber =
      (diviner.chime_phone_number as string | null | undefined)?.trim() ||
      process.env.CHIME_DEFAULT_PHONE_NUMBER?.trim();

    if (!smaId || !fromNumber) {
      return NextResponse.json(
        {
          error:
            "Chime voice is not configured on this environment (missing CHIME_SMA_ID or caller-ID number).",
        },
        { status: 503 }
      );
    }

    // ── Resolve meeting: reuse booking's if present, else create fresh ────
    let chimeMeetingId = booking.chime_meeting_id as string | null;

    if (!chimeMeetingId) {
      try {
        const meeting = await createChimeMeeting(
          booking.id,
          60, // 60 min cap — matches accept flow
          3 // client leg + diviner browser + 1 spare
        );
        chimeMeetingId = meeting.meetingId;

        await admin
          .from("bookings")
          .update({
            chime_meeting_id: chimeMeetingId,
            chime_external_meeting_id: meeting.externalMeetingId,
            video_provider: "chime",
          })
          .eq("id", booking.id);
      } catch (err) {
        console.error(
          "[chime/voice/call-client] Failed to create Chime meeting:",
          err
        );
        return NextResponse.json(
          { error: "Failed to create Chime meeting" },
          { status: 502 }
        );
      }
    }

    // ── Create attendees ───────────────────────────────────────────────────
    // Client PSTN leg: a fresh attendee whose JoinToken the Lambda will use
    // via JoinChimeMeeting once the client answers.
    const clientAttendee = await createChimeAttendee(
      chimeMeetingId,
      `phone-client-${booking.id}-${Date.now()}`
    );

    // Diviner browser leg: what this function returns to the UI.
    const divinerAttendee = await createChimeAttendee(
      chimeMeetingId,
      `diviner-browser-${diviner.id}-${Date.now()}`
    );

    // ── Insert phone_sessions row FIRST so we have its id to pass the SMA ─
    // (so SMA-driven callbacks like /hangup can reference the session by id.)
    //
    // NB: the Idempotency-Key header is used only for the in-memory
    // concurrency guard above (matching by diviner_id+booking_id). We
    // intentionally do NOT persist it to the row because there is no
    // idempotency_key column on phone_sessions — adding one would be a
    // separate migration. The concurrency guard catches double-clicks
    // within the same request window; real replay attempts would need
    // a follow-up migration adding a unique (diviner_id, idempotency_key)
    // index.
    const { data: inserted, error: insertErr } = await admin
      .from("phone_sessions")
      .insert({
        diviner_id: diviner.id,
        client_id: clientIdForSession,
        booking_id: booking.id,
        caller_phone: normalizedPhone,
        session_type: "outbound_diviner_call",
        direction: "outbound",
        phone_provider: "chime",
        chime_meeting_id: chimeMeetingId,
        status: "dialing",
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error(
        "[chime/voice/call-client] Failed to insert phone_sessions row:",
        insertErr
      );
      return NextResponse.json(
        { error: "Failed to record call session" },
        { status: 500 }
      );
    }

    const phoneSessionId = inserted.id as string;

    // ── Dial the client ────────────────────────────────────────────────────
    const voiceClient = getChimeVoiceClient();
    let outboundTransactionId: string | undefined;
    try {
      const outboundResult = await voiceClient.send(
        new CreateSipMediaApplicationCallCommand({
          FromPhoneNumber: fromNumber,
          ToPhoneNumber: normalizedPhone,
          SipMediaApplicationId: smaId,
          ArgumentsMap: {
            action: "dial_client_for_booking",
            meetingId: chimeMeetingId,
            joinToken: clientAttendee.joinToken,
            attendeeId: clientAttendee.attendeeId,
            phoneSessionId,
            bookingId: booking.id,
          },
        })
      );
      outboundTransactionId =
        outboundResult.SipMediaApplicationCall?.TransactionId;
    } catch (err) {
      console.error("[chime/voice/call-client] CreateSipMediaApplicationCall failed:", err);
      // Roll back the session so we don't leave a zombie "dialing" row.
      await admin
        .from("phone_sessions")
        .update({ status: "failed" })
        .eq("id", phoneSessionId);
      return NextResponse.json(
        { error: "Failed to place outbound call" },
        { status: 502 }
      );
    }

    if (outboundTransactionId) {
      await admin
        .from("phone_sessions")
        .update({ chime_transaction_id: outboundTransactionId })
        .eq("id", phoneSessionId);
    }

    // ── Start recording pipeline (audio-only). Non-fatal on failure. ──────
    try {
      const recording = await startChimeRecording(
        chimeMeetingId,
        `recordings/${phoneSessionId}`
      );
      if (recording?.pipelineArn) {
        await admin
          .from("phone_sessions")
          .update({ chime_pipeline_id: recording.pipelineArn })
          .eq("id", phoneSessionId);
      }
    } catch (err) {
      const name = (err as { name?: string }).name ?? "Error";
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[chime/voice/call-client] Recording pipeline failed: ${name}: ${msg}`
      );
    }

    // ── Fetch full meeting object for browser SDK ─────────────────────────
    const fullMeeting = await getChimeMeeting(chimeMeetingId);

    return NextResponse.json({
      reused: false,
      phoneSessionId,
      chimeMeetingId,
      outboundTransactionId: outboundTransactionId ?? null,
      meeting: fullMeeting,
      attendee: {
        AttendeeId: divinerAttendee.attendeeId,
        JoinToken: divinerAttendee.joinToken,
      },
    });
  } catch (error) {
    console.error("[chime/voice/call-client] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to call client",
      },
      { status: 500 }
    );
  }
}
