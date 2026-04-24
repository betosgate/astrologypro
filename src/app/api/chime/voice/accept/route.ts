import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChimeMeeting,
  createChimeAttendee,
  getChimeMeeting,
} from "@/lib/chime-meetings";
import { ensureSingleChimeRecordingPipeline } from "@/lib/chime-recording-pipeline";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { UpdateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/accept
 * Called by ChimePhoneWidget when the diviner clicks "Answer" on the dashboard.
 *
 * Flow:
 *   1. Verify the diviner is authenticated
 *   2. Look up the phone session (meeting may already exist from notify endpoint)
 *   3. Create or reuse the Chime meeting
 *   4. Create an attendee for the diviner's browser
 *   5. Bridge the PSTN caller into the meeting
 *   6. Cancel the outbound call to diviner's phone (if simultaneous ring is active)
 *   7. Return meeting + attendee info so the widget can join via browser SDK
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
    const { phoneSessionId } = body as {
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
      .select(
        "id, diviner_id, client_id, session_type, chime_meeting_id, chime_transaction_id, chime_outbound_transaction_id, chime_pipeline_id, status"
      )
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
    // The notify endpoint now pre-creates the meeting. Fall back to creating
    // one here if notify didn't (e.g. it failed or older flow).
    let chimeMeetingId = session.chime_meeting_id;

    if (!chimeMeetingId) {
      const meeting = await createChimeMeeting(
        phoneSessionId,
        60,
        2
      );
      chimeMeetingId = meeting.meetingId;

      await admin
        .from("phone_sessions")
        .update({ chime_meeting_id: chimeMeetingId })
        .eq("id", phoneSessionId);
    }

    // ── Start recording (audio-only — voice sessions have no composited video) ──
    // Idempotent: only start if no pipeline ARN is persisted on the session yet.
    // The same `recordings/<sessionId>/` S3 prefix is used so the
    // /api/bookings/<id>/recording-segments endpoint and the sync-recordings
    // cron can find the files without any special-casing.
    const recording = await ensureSingleChimeRecordingPipeline({
      table: "phone_sessions",
      sessionId: phoneSessionId,
      meetingId: chimeMeetingId,
      s3KeyPrefix: `recordings/${phoneSessionId}`,
      currentPipelineId: session.chime_pipeline_id,
      logLabel: "chime/voice/accept",
    });
    if (recording.status === "started") {
      console.log(
        `[chime/voice/accept] Recording pipeline started: id=${recording.pipelineId} arn=${recording.pipelineArn}`,
      );
    }

    // ── Create attendee for the diviner's browser ──────────────────────────
    const attendee = await createChimeAttendee(
      chimeMeetingId,
      `diviner-browser-${diviner.id}`
    );

    // ── Bridge the PSTN caller into the Chime meeting ──────────────────────
    const transactionId = session.chime_transaction_id;
    const smaId = process.env.CHIME_SMA_ID?.trim();

    if (transactionId && smaId) {
      try {
        // Create an attendee for the PSTN caller (may already exist from notify,
        // but createChimeAttendee with same externalUserId is idempotent-ish)
        const callerAttendee = await createChimeAttendee(
          chimeMeetingId,
          `phone-caller-${phoneSessionId}`
        );

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

        console.log(
          "[chime/voice/accept] Bridged caller. txId:",
          transactionId,
          "meetingId:",
          chimeMeetingId
        );
      } catch (bridgeErr) {
        console.error("[chime/voice/accept] Failed to bridge PSTN caller:", bridgeErr);
        // Continue — diviner still joins the meeting, caller bridge might recover
      }
    } else {
      console.warn(
        "[chime/voice/accept] Cannot bridge caller. txId:",
        transactionId,
        "smaId:",
        smaId
      );
    }

    // ── Cancel outbound call to diviner's phone (simultaneous ring) ────────
    // If the notify endpoint dialed the diviner's personal phone, cancel it
    // now since they answered from the dashboard instead.
    const outboundTxId = session.chime_outbound_transaction_id;
    if (outboundTxId && smaId) {
      try {
        const voiceClient = getChimeVoiceClient();
        await voiceClient.send(
          new UpdateSipMediaApplicationCallCommand({
            SipMediaApplicationId: smaId,
            TransactionId: outboundTxId,
            Arguments: {
              action: "cancel_ring",
            },
          })
        );
        console.log(
          "[chime/voice/accept] Cancelled outbound call to diviner phone. txId:",
          outboundTxId
        );
      } catch (cancelErr) {
        // Not fatal — outbound call may have already ended (diviner didn't answer phone)
        console.warn(
          "[chime/voice/accept] Could not cancel outbound call:",
          cancelErr
        );
      }
    }

    // ── Fetch full meeting object for browser SDK ──────────────────────────
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
