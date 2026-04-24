import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChimeAttendee,
  createChimeMeeting,
  getChimeMeeting,
  listChimeAttendees,
} from "@/lib/chime-meetings";
import { ensureSingleChimeRecordingPipeline } from "@/lib/chime-recording-pipeline";

export const dynamic = "force-dynamic";

/**
 * Chime attendee provisioning for `admin_bookings` rows.
 *
 * Mirrors `POST /api/chime/join-meeting` (which runs against the
 * `bookings` table) but reads from `admin_bookings` and enforces the
 * admin-host ↔ authenticated-client auth model. No product or money
 * concerns — these bookings have no service, no base price, no overage.
 *
 * Request body: { bookingId: string }
 *   Auth: supabase session. Allowed if either:
 *     - user.id === admin_bookings.admin_user_id   → role = "diviner" (host)
 *     - user.email === admin_bookings.client_email → role = "client"
 *
 * Response shape matches /api/chime/join-meeting so ChimeSessionRoom can
 * reuse the same data shape with `joinApiPath` pointing here.
 *
 * Recording policy (23.04.2026): admin↔trainee sessions ARE recorded by
 * default, matching diviner-booking behavior. The capture pipeline starts
 * the first time the host admin joins (role === "diviner" and no
 * chime_pipeline_id yet). The pipeline ARN is persisted to
 * `admin_bookings.chime_pipeline_id` so `/api/chime/admin-bookings/end`
 * can stop it and trigger concatenation on session end.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { bookingId } = (await request.json().catch(() => ({}))) as {
      bookingId?: string;
    };

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: booking, error: bookingError } = await admin
      .from("admin_bookings")
      .select(
        "id, admin_user_id, client_name, client_email, scheduled_at, duration_minutes, status, chime_meeting_id, chime_external_meeting_id, chime_pipeline_id, video_provider, session_started_at",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "canceled") {
      return NextResponse.json(
        { error: "This booking has been canceled" },
        { status: 422 },
      );
    }

    // Determine role + external user id for the attendee.
    const authEmail = user.email?.trim().toLowerCase() ?? null;
    const bookingEmail = (booking.client_email ?? "").trim().toLowerCase();

    let role: "diviner" | "client";
    let externalUserId: string;

    if (user.id === booking.admin_user_id) {
      role = "diviner"; // host — uses the same role token as a diviner host
      externalUserId = `admin-${booking.admin_user_id}`;
    } else if (authEmail && bookingEmail && authEmail === bookingEmail) {
      role = "client";
      externalUserId = `client-${user.id}`;
    } else {
      return NextResponse.json(
        { error: "You are not authorized for this session" },
        { status: 403 },
      );
    }

    // Reuse an existing meeting if AWS still has it, else create fresh.
    let activeMeetingId: string | null = booking.chime_meeting_id ?? null;
    let meeting: any;

    if (activeMeetingId) {
      try {
        meeting = await getChimeMeeting(activeMeetingId);
      } catch {
        activeMeetingId = null;
      }
    }

    if (!activeMeetingId) {
      const fresh = await createChimeMeeting(
        bookingId,
        Number(booking.duration_minutes) || 60,
        5,
      );
      activeMeetingId = fresh.meetingId;

      await admin
        .from("admin_bookings")
        .update({
          chime_meeting_id: activeMeetingId,
          chime_external_meeting_id: fresh.externalMeetingId,
          video_provider: "chime",
        })
        .eq("id", bookingId);

      meeting = await getChimeMeeting(activeMeetingId);
    }

    // ── Start recording when the host joins ────────────────────────────────
    // Guarded by a DB reservation so two host tabs/retries cannot create two
    // capture pipelines for the same meeting.
    const recordingPromise =
      role === "diviner"
        ? ensureSingleChimeRecordingPipeline({
            table: "admin_bookings",
            sessionId: bookingId,
            meetingId: activeMeetingId,
            s3KeyPrefix: `recordings/${bookingId}`,
            currentPipelineId: booking.chime_pipeline_id,
            logLabel: "admin-bookings/join",
          })
        : Promise.resolve(null);

    const attendee = await createChimeAttendee(activeMeetingId!, externalUserId);

    const recording = await recordingPromise;
    if (recording?.status === "started") {
      console.log(
        `[admin-bookings/join] Recording pipeline started: id=${recording.pipelineId} arn=${recording.pipelineArn}`,
      );
    }

    // Client side: detect whether the host is already in the meeting so the
    // "waiting for host" state can resolve without a second fetch.
    let divinerPresent = role === "diviner";
    if (role === "client") {
      try {
        const list = await listChimeAttendees(activeMeetingId!);
        divinerPresent = list.some(
          (a) =>
            a.externalUserId.startsWith("admin-") &&
            a.attendeeId !== attendee.attendeeId,
        );
      } catch {
        // best-effort; fall back to false
      }
    }

    // Persist session_started_at the first time we see anyone join so the
    // duration the end-meeting endpoint calculates is consistent across page
    // reloads. We only write if it hasn't been set yet to preserve the true
    // first-join timestamp.
    let sessionStartedAt: string =
      (booking.session_started_at as string | null) ??
      new Date().toISOString();
    if (!booking.session_started_at) {
      void admin
        .from("admin_bookings")
        .update({ session_started_at: sessionStartedAt })
        .eq("id", bookingId)
        .is("session_started_at", null)
        .then(
          () => {},
          () => {},
        );
    }

    return NextResponse.json({
      meeting: {
        MeetingId: meeting.MeetingId,
        MediaPlacement: meeting.MediaPlacement,
        MediaRegion: meeting.MediaRegion,
      },
      attendee: {
        AttendeeId: attendee.attendeeId,
        JoinToken: attendee.joinToken,
      },
      role,
      sessionStartedAt,
      divinerPresent,
      participants: {
        divinerName: "Host",
        clientName: booking.client_name ?? "Client",
      },
    });
  } catch (error) {
    console.error("Admin-booking Chime join error:", error);
    return NextResponse.json(
      { error: "Failed to join Chime meeting" },
      { status: 500 },
    );
  }
}
