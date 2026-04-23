import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  endChimeMeeting,
  stopChimeRecording,
  startChimeConcatenation,
} from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/hangup
 * Called by ChimePhoneWidget when the diviner clicks "Hang Up".
 *
 * Teardown order (same as end-meeting for video):
 *   1. Stop capture pipeline (flushes remaining audio segments to S3)
 *   2. Grace period so AWS can finish writing the last fragments
 *   3. Start concatenation pipeline (merges segments → final MP4 in
 *      recordings/<phoneSessionId>/final/)
 *   4. Delete the Chime meeting (disconnects PSTN caller + diviner)
 *   5. Mark session completed
 *
 * Reversing #1 and #4 truncates the recording — AWS tears the capture
 * pipeline down abruptly when the meeting is deleted and only already-
 * flushed segments are kept.
 */

const CONCAT_GRACE_MS = 3000;

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

    // Fetch session to get chime_meeting_id + chime_pipeline_id
    const { data: session } = await admin
      .from("phone_sessions")
      .select(
        "id, diviner_id, chime_meeting_id, chime_pipeline_id, started_at, status"
      )
      .eq("id", phoneSessionId)
      .single();

    if (!session || session.diviner_id !== diviner.id) {
      return NextResponse.json(
        { error: "Session not found or not yours" },
        { status: 404 }
      );
    }

    // ── Recording + meeting teardown ─────────────────────────────────────────
    if (session.chime_meeting_id) {
      // Step 1: stop capture pipeline (flush remaining segments to S3).
      if (session.chime_pipeline_id) {
        try {
          await stopChimeRecording(session.chime_pipeline_id);
          console.log(
            `[chime/voice/hangup] Capture pipeline stopped: ${session.chime_pipeline_id}`
          );
        } catch (err) {
          const errName = (err as { name?: string }).name ?? "";
          if (errName !== "ConflictException") {
            console.error(
              "[chime/voice/hangup] Failed to stop capture pipeline:",
              err
            );
          }
        }

        // Step 2: grace period for final-fragment flush.
        await new Promise((resolve) => setTimeout(resolve, CONCAT_GRACE_MS));

        // Step 3: start concatenation pipeline.
        try {
          await startChimeConcatenation(
            session.chime_pipeline_id,
            phoneSessionId
          );
          console.log(
            `[chime/voice/hangup] Concatenation started for phone session ${phoneSessionId}`
          );
        } catch (err) {
          console.error(
            "[chime/voice/hangup] Failed to start concatenation:",
            err
          );
        }
      }

      // Step 4: delete the Chime meeting LAST.
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

    // Step 5: mark session as completed
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
