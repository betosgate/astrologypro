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
 * POST /api/chime/admin-bookings/end
 *
 * Mirror of `/api/chime/end-meeting` but for `admin_bookings` rows (the
 * admin↔trainee video flow). The session teardown order is critical for
 * recordings:
 *
 *   1. Stop the capture pipeline so AWS flushes the last segments to S3
 *   2. WAIT a short grace period so the final .mp4 fragments finish
 *      writing before the concat pipeline tries to read them
 *   3. Start the concatenation pipeline — merges all composited-video
 *      segments under recordings/{bookingId}/ into a single
 *      recordings/{bookingId}/final/<uuid>.mp4
 *   4. Delete the Chime meeting
 *
 * Reversing any of these (e.g. deleting the meeting first) truncates the
 * recording — AWS tears the capture pipeline down abruptly and only the
 * already-flushed segments are kept, which is what was producing the
 * 5-second recordings prior to this route existing.
 *
 * Auth: supabase session. Either the host admin OR the booking's client
 * (trainee) may call this — whoever actually clicked "End Session".
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

    const body = await request.json().catch(() => ({}));
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const actualDurationMinutes = Number(body?.actualDurationMinutes);

    if (!bookingId || !Number.isFinite(actualDurationMinutes)) {
      return NextResponse.json(
        { error: "Missing bookingId or actualDurationMinutes" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await admin
      .from("admin_bookings")
      .select(
        "id, admin_user_id, client_email, duration_minutes, chime_meeting_id, chime_pipeline_id, status",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Auth — either the host admin, or the booking's client-email match.
    const authEmail = user.email?.trim().toLowerCase() ?? null;
    const bookingEmail = (booking.client_email ?? "").trim().toLowerCase();
    const isHost = user.id === booking.admin_user_id;
    const isClient =
      !!authEmail && !!bookingEmail && authEmail === bookingEmail;

    if (!isHost && !isClient) {
      return NextResponse.json(
        { error: "You are not authorized to end this session" },
        { status: 403 },
      );
    }

    // ── Recording & meeting teardown ────────────────────────────────────────
    if (booking.chime_meeting_id) {
      // Step 1: stop capture pipeline (flushes remaining segments to S3).
      if (booking.chime_pipeline_id) {
        try {
          await stopChimeRecording(booking.chime_pipeline_id);
          console.log(
            `[admin-bookings/end] capture pipeline stopped: ${booking.chime_pipeline_id}`,
          );
        } catch (err) {
          const errName = (err as { name?: string }).name ?? "";
          if (errName !== "ConflictException") {
            console.error(
              "[admin-bookings/end] failed to stop capture pipeline:",
              err,
            );
          }
        }

        // Step 2: grace period. AWS writes the last 1–2 segments asynchronously
        // after the Delete call — if we kick off concatenation immediately, it
        // picks up a short slice instead of the full session.
        await new Promise((resolve) => setTimeout(resolve, CONCAT_GRACE_MS));

        // Step 3: start concatenation pipeline (merges segments → final MP4).
        try {
          await startChimeConcatenation(booking.chime_pipeline_id, bookingId);
          console.log(
            `[admin-bookings/end] concatenation started for booking ${bookingId}`,
          );
        } catch (err) {
          console.error(
            "[admin-bookings/end] failed to start concatenation:",
            err,
          );
        }
      }

      // Step 4: delete the Chime meeting LAST (after pipeline is stopped and
      // concatenation is queued). Deleting earlier would tear down the capture
      // pipeline abruptly and lose unflushed segments.
      try {
        await endChimeMeeting(booking.chime_meeting_id);
      } catch (err) {
        console.error(
          "[admin-bookings/end] failed to delete Chime meeting:",
          err,
        );
      }
    }

    // Mark booking as done. We DO NOT flip status to "canceled" — that's a
    // CHECK-constrained enum that currently only allows 'confirmed' | 'canceled'.
    // Until we have a migration for a "completed" state, keep status=confirmed
    // and record the lifecycle in ended_at + actual_duration_minutes.
    await admin
      .from("admin_bookings")
      .update({
        ended_at: new Date().toISOString(),
        actual_duration_minutes: Math.round(actualDurationMinutes),
      })
      .eq("id", bookingId);

    return NextResponse.json({
      ok: true,
      actualDurationMinutes: Math.round(actualDurationMinutes),
    });
  } catch (error) {
    console.error("[admin-bookings/end] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
