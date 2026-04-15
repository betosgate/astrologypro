import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeMeeting, createChimeAttendee } from "@/lib/chime-meetings";

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
 *   5. Mark the notification as "accepted"
 *   6. Return meeting + attendee info so the widget can join
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
      .select("id, diviner_id, client_id, session_type, chime_meeting_id, status")
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
      .update({ status: "active" })
      .eq("id", phoneSessionId);

    return NextResponse.json({
      chimeMeetingId,
      attendeeId: attendee.attendeeId,
      joinToken: attendee.joinToken,
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
