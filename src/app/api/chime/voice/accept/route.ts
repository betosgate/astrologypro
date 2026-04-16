import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeMeeting, createChimeAttendee, getChimeMeeting } from "@/lib/chime-meetings";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { UpdateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/accept
 * Called by ChimePhoneWidget when the diviner clicks "Answer".
 *
 * Flow:
 *   1. Verify the diviner is authenticated
 *   2. Look up the phone session and call notification
 *   3. Create a Chime meeting for the call (if standalone — no existing meeting)
 *   4. Create an attendee for the diviner
 *   5. Use UpdateSipMediaApplicationCall to bridge the PSTN caller into the meeting
 *   6. Mark the notification as "accepted"
 *   7. Return meeting + attendee info so the widget can join
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

    // Verify caller is a diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Only diviners can accept calls" },
        { status: 403 }
      );
    }

    // ── Input ──────────────────────────────────────────────────────────────
    const body = await request.json();
    const { phoneSessionId, callId } = body as {
      phoneSessionId?: string;
      callId?: string;
    };

    if (!phoneSessionId) {
      return NextResponse.json(
        { error: "Missing phoneSessionId" },
        { status: 400 }
      );
    }

    // ── Fetch phone session ────────────────────────────────────────────────
    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, diviner_id, client_id, session_type, chime_meeting_id, chime_transaction_id, status")
      .eq("id", phoneSessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Phone session not found" },
        { status: 404 }
      );
    }

    if (session.diviner_id !== diviner.id) {
      return NextResponse.json(
        { error: "This call is not for you" },
        { status: 403 }
      );
    }

    // ── Create or reuse Chime meeting ──────────────────────────────────────
    let chimeMeetingId = session.chime_meeting_id;

    if (!chimeMeetingId) {
      // Standalone call — create a new meeting for this phone session
      const meeting = await createChimeMeeting(
        phoneSessionId,
        60, // default 60 minutes max
        2   // diviner + caller
      );
      chimeMeetingId = meeting.meetingId;

      // Save the meeting ID to the phone session
      await admin
        .from("phone_sessions")
        .update({ chime_meeting_id: chimeMeetingId })
        .eq("id", phoneSessionId);
    }

    // ── Create attendee for the diviner ────────────────────────────────────
    const attendee = await createChimeAttendee(
      chimeMeetingId,
      `diviner-${diviner.id}`
    );

    // ── Bridge the PSTN caller into the Chime meeting ──────────────────────
    // Use the TransactionId stored by the notify endpoint to call UpdateSipMediaApplicationCall
    const transactionId = session.chime_transaction_id;
    const smaId = process.env.CHIME_SMA_ID?.trim();

    if (transactionId && smaId) {
      try {
        // Create an attendee for the PSTN caller
        const callerAttendee = await createChimeAttendee(
          chimeMeetingId,
          `phone-caller-${phoneSessionId}`
        );

        // Tell the SMA to bridge the PSTN call into the meeting
        const voiceClient = getChimeVoiceClient();
        await voiceClient.send(
          new UpdateSipMediaApplicationCallCommand({
            SipMediaApplicationId: smaId,
            TransactionId: transactionId,
            Arguments: {
              action: "join_meeting",
              meetingId: chimeMeetingId,
              joinToken: callerAttendee.joinToken,
              attendeeId: callerAttendee.attendeeId,
            },
          })
        );

        console.log("[chime/voice/accept] Sent UpdateSipMediaApplicationCall to bridge caller. transactionId:", transactionId, "meetingId:", chimeMeetingId);
      } catch (bridgeErr) {
        console.error("[chime/voice/accept] Failed to bridge PSTN caller:", bridgeErr);
        // Return error details so we can debug from the browser console
        return NextResponse.json({
          chimeMeetingId,
          attendeeId: attendee.attendeeId,
          joinToken: attendee.joinToken,
          bridgeError: bridgeErr instanceof Error ? bridgeErr.message : String(bridgeErr),
          bridgeDetails: { transactionId, smaId },
        });
      }
    } else {
      console.warn("[chime/voice/accept] Cannot bridge PSTN caller. transactionId:", transactionId, "smaId:", smaId);
      return NextResponse.json({
        chimeMeetingId,
        attendeeId: attendee.attendeeId,
        joinToken: attendee.joinToken,
        bridgeError: "Missing transactionId or CHIME_SMA_ID",
        bridgeDetails: { transactionId: transactionId ?? "NOT SET", smaId: smaId ?? "NOT SET" },
      });
    }

    // ── Fetch full meeting object (includes MediaPlacement for browser SDK) ──
    const fullMeeting = await getChimeMeeting(chimeMeetingId);

    // ── Mark notification as accepted ──────────────────────────────────────
    await admin
      .from("phone_call_notifications")
      .update({ status: "accepted" })
      .eq("phone_session_id", phoneSessionId)
      .eq("diviner_id", diviner.id)
      .eq("status", "ringing");

    // ── Update phone session status ────────────────────────────────────────
    await admin
      .from("phone_sessions")
      .update({ status: "accepted" })
      .eq("id", phoneSessionId);

    return NextResponse.json({
      chimeMeetingId,
      attendeeId: attendee.attendeeId,
      joinToken: attendee.joinToken,
      // Full AWS objects needed by browser SDK MeetingSessionConfiguration
      meeting: fullMeeting,
      attendee: {
        AttendeeId: attendee.attendeeId,
        JoinToken: attendee.joinToken,
      },
    });
  } catch (error) {
    console.error("[chime/voice/accept] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to accept call",
      },
      { status: 500 }
    );
  }
}
