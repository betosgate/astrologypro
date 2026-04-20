import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeMeeting, createChimeAttendee } from "@/lib/chime-meetings";
import { getChimeVoiceClient } from "@/lib/chime-client";
import { CreateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/notify
 * Called by the SMA Lambda to notify a diviner about an incoming call.
 *
 * Handles the full "simultaneous ring" setup:
 *   1. Create a Chime meeting immediately (so both paths can join it)
 *   2. Store notification for dashboard widget polling
 *   3. If phone_answer_mode is "mobile" or "both": dial the diviner's phone
 *   4. Send Web Push notification to all subscribed devices
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      divinerId,
      phoneSessionId,
      callerPhone,
      callId,
      transactionId,
      phoneAnswerMode,
      phoneMobile,
      chimePhoneNumber,
    } = await request.json();

    if (!divinerId) {
      return NextResponse.json(
        { error: "Missing divinerId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── 1. Create Chime meeting immediately ──────────────────────────────
    // Creating the meeting now (instead of in the accept endpoint) means
    // both the dashboard and phone paths can join the same meeting.
    let chimeMeetingId: string | null = null;
    let callerJoinToken: string | null = null;
    let callerAttendeeId: string | null = null;

    if (phoneSessionId) {
      try {
        const meeting = await createChimeMeeting(
          phoneSessionId,
          60, // 60 min max
          3   // caller + diviner browser + diviner phone
        );
        chimeMeetingId = meeting.meetingId;

        // Pre-create attendee for the PSTN caller (will be used to bridge them in)
        const callerAttendee = await createChimeAttendee(
          chimeMeetingId,
          `phone-caller-${phoneSessionId}`
        );
        callerJoinToken = callerAttendee.joinToken;
        callerAttendeeId = callerAttendee.attendeeId;

        // Save meeting + caller attendee info to phone session
        await admin
          .from("phone_sessions")
          .update({
            chime_meeting_id: chimeMeetingId,
            chime_transaction_id: transactionId,
          })
          .eq("id", phoneSessionId);

        console.log(
          "[chime/voice/notify] Created meeting:",
          chimeMeetingId,
          "callerAttendee:",
          callerAttendeeId
        );
      } catch (err) {
        console.error("[chime/voice/notify] Failed to create meeting:", err);
        // Fallback: just store transactionId, accept endpoint will create meeting
        if (transactionId) {
          await admin
            .from("phone_sessions")
            .update({ chime_transaction_id: transactionId })
            .eq("id", phoneSessionId);
        }
      }
    }

    // ── 2. Store notification for dashboard widget ───────────────────────
    await admin.from("phone_call_notifications").insert({
      diviner_id: divinerId,
      phone_session_id: phoneSessionId,
      caller_phone: callerPhone,
      call_id: callId,
      status: "ringing",
      provider: "chime",
      created_at: new Date().toISOString(),
    });

    // ── 3. Dial diviner's personal phone (simultaneous ring) ─────────────
    const answerMode = phoneAnswerMode ?? "browser";
    const shouldDialPhone =
      (answerMode === "mobile" || answerMode === "both") &&
      phoneMobile &&
      chimeMeetingId;

    if (shouldDialPhone) {
      try {
        const smaId = process.env.CHIME_SMA_ID?.trim();
        const fromNumber =
          chimePhoneNumber || process.env.CHIME_DEFAULT_PHONE_NUMBER?.trim();

        if (!smaId || !fromNumber) {
          console.warn(
            "[chime/voice/notify] Cannot dial diviner: missing CHIME_SMA_ID or from number"
          );
        } else {
          // Create attendee for the diviner's phone leg
          const divinerPhoneAttendee = await createChimeAttendee(
            chimeMeetingId!,
            `diviner-phone-${divinerId}`
          );

          const voiceClient = getChimeVoiceClient();
          const outboundResult = await voiceClient.send(
            new CreateSipMediaApplicationCallCommand({
              FromPhoneNumber: fromNumber,
              ToPhoneNumber: phoneMobile,
              SipMediaApplicationId: smaId,
              ArgumentsMap: {
                action: "ring_diviner",
                meetingId: chimeMeetingId!,
                joinToken: divinerPhoneAttendee.joinToken,
                attendeeId: divinerPhoneAttendee.attendeeId,
                phoneSessionId: phoneSessionId ?? "",
                inboundTransactionId: transactionId ?? "",
                callerJoinToken: callerJoinToken ?? "",
                callerAttendeeId: callerAttendeeId ?? "",
              },
            })
          );

          const outboundTransactionId =
            outboundResult.SipMediaApplicationCall?.TransactionId;

          if (outboundTransactionId && phoneSessionId) {
            await admin
              .from("phone_sessions")
              .update({
                chime_outbound_transaction_id: outboundTransactionId,
              })
              .eq("id", phoneSessionId);
          }

          console.log(
            "[chime/voice/notify] Dialed diviner phone:",
            phoneMobile,
            "outboundTxId:",
            outboundTransactionId
          );
        }
      } catch (err) {
        console.error(
          "[chime/voice/notify] Failed to dial diviner phone:",
          err
        );
        // Non-fatal — dashboard path still works
      }
    }

    // ── 4. Send Web Push notification ────────────────────────────────────
    try {
      const { sendPushToDiv } = await import("@/lib/web-push");
      await sendPushToDiv(divinerId, {
        title: "Incoming Call",
        body: `Call from ${callerPhone || "Unknown"}`,
        icon: "/favicon.svg",
        tag: "incoming-call",
        url: "/dashboard",
        phoneSessionId: phoneSessionId ?? undefined,
        requireInteraction: true,
      });
    } catch (err) {
      console.error("[chime/voice/notify] Web push failed:", err);
      // Non-fatal
    }

    return NextResponse.json({ notified: true, chimeMeetingId });
  } catch (error) {
    console.error("Chime voice notify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
