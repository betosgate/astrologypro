import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeAttendee } from "@/lib/chime-meetings";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { UpdateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/bridge-caller
 * Called by the SMA Lambda when the diviner answers their personal phone.
 *
 * Looks up the phone session in the database to get the inbound transaction ID,
 * creates a fresh caller attendee (JoinToken), and uses
 * UpdateSipMediaApplicationCall to bridge the original PSTN caller into
 * the Chime meeting.
 *
 * Body: { phoneSessionId, meetingId }
 *   — all other data is looked up from the database.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: Lambda uses CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneSessionId, meetingId } = body as {
      phoneSessionId?: string;
      meetingId?: string;
    };

    if (!phoneSessionId || !meetingId) {
      return NextResponse.json(
        { error: "Missing phoneSessionId or meetingId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Look up the phone session to get the inbound transaction ID
    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, chime_transaction_id, chime_meeting_id")
      .eq("id", phoneSessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Phone session not found" },
        { status: 404 }
      );
    }

    const inboundTransactionId = session.chime_transaction_id;
    if (!inboundTransactionId) {
      return NextResponse.json(
        { error: "No inbound transaction ID on phone session" },
        { status: 400 }
      );
    }

    const smaId = process.env.CHIME_SMA_ID?.trim();
    if (!smaId) {
      return NextResponse.json(
        { error: "CHIME_SMA_ID not configured" },
        { status: 500 }
      );
    }

    // Create a fresh caller attendee with a valid JoinToken
    const callerAttendee = await createChimeAttendee(
      meetingId,
      `phone-caller-${phoneSessionId}`
    );

    console.log(
      "[chime/voice/bridge-caller] Created caller attendee:",
      callerAttendee.attendeeId,
      "joinToken length:",
      callerAttendee.joinToken?.length
    );

    // Bridge the original caller into the Chime meeting
    const voiceClient = getChimeVoiceClient();
    await voiceClient.send(
      new UpdateSipMediaApplicationCallCommand({
        SipMediaApplicationId: smaId,
        TransactionId: inboundTransactionId,
        Arguments: {
          action: "join_meeting",
          meetingId,
          joinToken: callerAttendee.joinToken,
          attendeeId: callerAttendee.attendeeId,
        },
      })
    );

    console.log(
      "[chime/voice/bridge-caller] Bridged caller into meeting:",
      meetingId,
      "inboundTxId:",
      inboundTransactionId
    );

    // Update phone session status
    await admin
      .from("phone_sessions")
      .update({ status: "accepted" })
      .eq("id", phoneSessionId);

    // Mark notification as accepted
    await admin
      .from("phone_call_notifications")
      .update({ status: "accepted" })
      .eq("phone_session_id", phoneSessionId)
      .eq("status", "ringing");

    return NextResponse.json({ bridged: true });
  } catch (error) {
    console.error("[chime/voice/bridge-caller] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to bridge caller",
      },
      { status: 500 }
    );
  }
}
