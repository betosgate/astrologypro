import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { endChimeMeeting } from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/hangup
 * Called by ChimePhoneWidget when the diviner clicks "Hang Up".
 *
 * 1. Ends the Chime meeting (which disconnects all participants including PSTN caller)
 * 2. Marks the phone session as "completed"
 * 3. Marks any remaining "ringing" notifications as "declined"
 */
export async function POST(request: NextRequest) {
  try {
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
        { error: "Only diviners can hang up calls" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phoneSessionId } = body as { phoneSessionId?: string };

    if (!phoneSessionId) {
      return NextResponse.json(
        { error: "Missing phoneSessionId" },
        { status: 400 }
      );
    }

    // Fetch session to get chime_meeting_id
    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, diviner_id, chime_meeting_id, started_at, status")
      .eq("id", phoneSessionId)
      .single();

    if (!session || session.diviner_id !== diviner.id) {
      return NextResponse.json(
        { error: "Session not found or not yours" },
        { status: 404 }
      );
    }

    // End the Chime meeting — this disconnects all attendees including the PSTN caller
    if (session.chime_meeting_id) {
      try {
        await endChimeMeeting(session.chime_meeting_id);
        console.log(
          "[chime/voice/hangup] Ended Chime meeting:",
          session.chime_meeting_id
        );
      } catch (err) {
        // Meeting may already be ended (e.g. caller hung up first)
        console.warn("[chime/voice/hangup] Could not end meeting:", err);
      }
    }

    // Calculate duration
    const startedAt = session.started_at
      ? new Date(session.started_at)
      : new Date();
    const durationSeconds = Math.round(
      (Date.now() - startedAt.getTime()) / 1000
    );

    // Mark session as completed
    await admin
      .from("phone_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq("id", phoneSessionId);

    // Clean up any lingering ringing notifications
    await admin
      .from("phone_call_notifications")
      .update({ status: "declined" })
      .eq("phone_session_id", phoneSessionId)
      .eq("status", "ringing");

    return NextResponse.json({ ok: true, durationSeconds });
  } catch (error) {
    console.error("[chime/voice/hangup] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to hang up",
      },
      { status: 500 }
    );
  }
}
