import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { endChimeMeeting, stopChimeRecording, startChimeConcatenation } from "@/lib/chime-meetings";
import { waitForUsableChimePipelineId } from "@/lib/chime-recording-pipeline";
import { PRICING } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, actualDurationMinutes, sessionNotes, chatTranscript } = await request.json();

    if (!bookingId || actualDurationMinutes == null) {
      return NextResponse.json(
        { error: "Missing bookingId or actualDurationMinutes" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch booking with service info
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select(
        "id, diviner_id, base_price, duration_minutes, chime_meeting_id, chime_pipeline_id, services(duration_minutes, overage_rate)"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user is the diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner || diviner.id !== booking.diviner_id) {
      return NextResponse.json(
        { error: "Only the diviner can end a session" },
        { status: 403 }
      );
    }

    // ── Recording & meeting teardown ─────────────────────────────────────────
    // CORRECT SEQUENCE (order matters!):
    //   1. Stop the capture pipeline — flushes remaining segment files to S3
    //   2. Start concatenation — merges segments into one MP4
    //   3. Delete the meeting — only AFTER pipeline is stopped
    //
    // Previous code deleted the meeting first, which killed the capture
    // pipeline abruptly. AWS would only have the first few seconds of
    // segments flushed, producing a 5-second recording for a 3-minute call.
    if (booking.chime_meeting_id) {
      const capturePipelineArn = await waitForUsableChimePipelineId({
        table: "bookings",
        sessionId: bookingId,
        currentPipelineId: booking.chime_pipeline_id,
      });

      // Step 1: Stop the capture pipeline gracefully so all segments flush to S3
      if (capturePipelineArn) {
        try {
          await stopChimeRecording(capturePipelineArn);
          console.log(`[end-meeting] Capture pipeline stopped: ${capturePipelineArn}`);
        } catch (err) {
          // ConflictException means it's already stopped — safe to continue
          const errName = (err as { name?: string }).name ?? "";
          if (errName !== "ConflictException") {
            console.error("[end-meeting] Failed to stop capture pipeline:", err);
          }
        }

        // Step 2: grace period. AWS writes the last 1–2 composited-video
        // fragments asynchronously after the Delete call returns. Kicking off
        // concatenation immediately picks up whatever happens to be on S3 at
        // that instant, which was producing the short "final" MP4. A few
        // seconds is enough for the in-flight fragments to settle.
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Step 3: Trigger concatenation — merges all segment files into a single
        // MP4: recordings/{bookingId}/final/. Runs asynchronously on AWS;
        // sync-recordings cron picks up the result.
        try {
          await startChimeConcatenation(capturePipelineArn, bookingId);
          console.log(`[end-meeting] Concatenation pipeline started for booking ${bookingId}`);
        } catch (err) {
          console.error("[end-meeting] Failed to start concatenation:", err);
        }
      }

      // Step 4: Delete the meeting LAST — after pipeline is stopped and
      // concatenation is queued
      try {
        await endChimeMeeting(booking.chime_meeting_id);
      } catch (err) {
        console.error("Failed to delete Chime meeting:", err);
      }

      // Update video_sessions record if one exists
      const { data: videoSession } = await admin
        .from("video_sessions")
        .select("id")
        .eq("chime_meeting_id", booking.chime_meeting_id)
        .single();

      if (videoSession) {
        await admin
          .from("video_sessions")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
            duration_seconds: Math.round(actualDurationMinutes * 60),
          })
          .eq("id", videoSession.id);
      }
    }

    // Calculate overage (same logic as Daily.co end-session)
    const scheduledDuration =
      (booking.services as any)?.duration_minutes ??
      booking.duration_minutes ??
      60;
    const overageMinutes = Math.max(
      0,
      actualDurationMinutes - scheduledDuration
    );
    const perMinuteRate =
      (booking.services as any)?.overage_rate ?? PRICING.overagePerMinute;
    const overageAmount = Math.round(
      overageMinutes * perMinuteRate * 100
    ); // in cents
    const totalAmount =
      Math.round((booking.base_price ?? 0) * 100) + overageAmount;

    // Update booking to completed
    // NOTE: completed_at column does not exist on bookings table — omit it.
    const updatePayload: Record<string, unknown> = {
      status: "completed",
      actual_duration_minutes: Math.round(actualDurationMinutes),
      overage_amount: overageAmount,
      total_amount: totalAmount,
    };
    if (sessionNotes) updatePayload.session_notes = sessionNotes;
    if (chatTranscript) updatePayload.chat_transcript = chatTranscript;

    const { error: updateError } = await admin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking:", updateError);
      return NextResponse.json(
        { error: "Failed to complete session" },
        { status: 500 }
      );
    }

    // Create follow-up email sequences (same as Daily.co)
    const { data: fullBooking } = await admin
      .from("bookings")
      .select("client_id")
      .eq("id", bookingId)
      .single();

    if (fullBooking?.client_id) {
      const now = new Date();
      const followUps = [
        {
          booking_id: bookingId,
          diviner_id: booking.diviner_id,
          client_id: fullBooking.client_id,
          step: 1,
          scheduled_at: new Date(
            now.getTime() + 1 * 60 * 60 * 1000
          ).toISOString(),
          email_type: "recording_ready",
        },
        {
          booking_id: bookingId,
          diviner_id: booking.diviner_id,
          client_id: fullBooking.client_id,
          step: 2,
          scheduled_at: new Date(
            now.getTime() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          email_type: "reflection",
        },
        {
          booking_id: bookingId,
          diviner_id: booking.diviner_id,
          client_id: fullBooking.client_id,
          step: 3,
          scheduled_at: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          email_type: "rebooking",
        },
      ];

      const { error: followUpError } = await admin
        .from("follow_up_sequences")
        .insert(followUps);

      if (followUpError) {
        console.error("Failed to create follow-up sequences:", followUpError);
      }
    }

    return NextResponse.json({
      status: "completed",
      actualDurationMinutes: Math.round(actualDurationMinutes),
      overageMinutes,
      overageAmount,
      totalAmount,
    });
  } catch (error) {
    console.error("Chime end meeting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
