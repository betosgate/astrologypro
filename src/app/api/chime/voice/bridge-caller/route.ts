import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { UpdateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/bridge-caller
 * Called by the SMA Lambda when the diviner answers their personal phone.
 *
 * Uses UpdateSipMediaApplicationCall to tell the SMA to bridge the
 * original PSTN caller (who is on hold) into the Chime meeting.
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
    const {
      phoneSessionId,
      inboundTransactionId,
      meetingId,
      callerJoinToken,
      callerAttendeeId,
    } = body as {
      phoneSessionId?: string;
      inboundTransactionId?: string;
      meetingId?: string;
      callerJoinToken?: string;
      callerAttendeeId?: string;
    };

    if (!inboundTransactionId || !meetingId || !callerJoinToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Bridge the original caller into the Chime meeting
    const voiceClient = getChimeVoiceClient();
    await voiceClient.send(
      new UpdateSipMediaApplicationCallCommand({
        SipMediaApplicationId: smaId,
        TransactionId: inboundTransactionId,
        Arguments: {
          action: "join_meeting",
          meetingId,
          joinToken: callerJoinToken,
          attendeeId: callerAttendeeId ?? "",
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
    if (phoneSessionId) {
      const admin = createAdminClient();
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
    }

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
