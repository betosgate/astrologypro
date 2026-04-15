import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChimeMeeting,
  createChimeAttendee,
  startChimeRecording,
} from "@/lib/chime-meetings";

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

    const { bookingId, duration } = await request.json();

    if (!bookingId || !duration) {
      return NextResponse.json(
        { error: "Missing bookingId or duration" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch the booking to verify ownership
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select(
        "id, scheduled_at, diviner_id, client_id, status, questionnaire_responses"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user is the diviner for this booking
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner || diviner.id !== booking.diviner_id) {
      return NextResponse.json(
        { error: "Only the diviner can create a session room" },
        { status: 403 }
      );
    }

    const questionnaire = (
      (booking as Record<string, unknown>).questionnaire_responses ?? {}
    ) as Record<string, string>;
    const hasGuest =
      questionnaire.secondPersonAttending === "yes" ||
      questionnaire.secondPersonAttending === "maybe";
    const maxParticipants = hasGuest ? 3 : 2;

    // Create Chime meeting
    const meeting = await createChimeMeeting(
      bookingId,
      duration,
      maxParticipants
    );

    // Create attendee for the diviner
    const divinerAttendee = await createChimeAttendee(
      meeting.meetingId,
      `diviner-${diviner.id}`
    );

    // Start recording (non-blocking if bucket not configured)
    let pipelineId = "";
    let pipelineArn = "";
    let recordingError = "";
    try {
      const recording = await startChimeRecording(
        meeting.meetingId,
        `recordings/${bookingId}`
      );
      pipelineId = recording.pipelineId;
      pipelineArn = recording.pipelineArn;
      if (pipelineArn) {
        console.log(`[create-meeting] Recording pipeline started: id=${pipelineId} arn=${pipelineArn}`);
      } else {
        recordingError = "startChimeRecording returned empty pipelineArn";
        console.warn("[create-meeting]", recordingError);
      }
    } catch (err: unknown) {
      const name = (err as { name?: string }).name ?? "Error";
      const msg = err instanceof Error ? err.message : String(err);
      recordingError = `${name}: ${msg}`;
      console.error("[create-meeting] Failed to start Chime recording:", recordingError);
    }

    // Update booking with Chime meeting details + pipeline ARN
    // (pipeline ARN is needed to trigger concatenation when session ends)
    const baseUpdate: Record<string, unknown> = {
      chime_meeting_id: meeting.meetingId,
      chime_external_meeting_id: meeting.externalMeetingId,
      video_provider: "chime",
      status: "confirmed",
    };
    if (pipelineArn) baseUpdate.chime_pipeline_id = pipelineArn;

    const { error: updateError } = await admin
      .from("bookings")
      .update(baseUpdate)
      .eq("id", bookingId);

    if (updateError) {
      console.error(
        "[create-meeting] Failed to update booking with Chime meeting info:",
        updateError
      );
    }

    // Store pipeline ID in video_sessions for later cleanup
    await admin.from("video_sessions").insert({
      booking_id: bookingId,
      diviner_id: diviner.id,
      client_id: booking.client_id,
      room_id: meeting.meetingId,
      room_name: meeting.externalMeetingId,
      provider: "chime",
      status: "created",
      diviner_token: divinerAttendee.joinToken,
      chime_meeting_id: meeting.meetingId,
      chime_external_meeting_id: meeting.externalMeetingId,
      phone_dial_in_enabled: false,
    });

    // Send room link to guest if applicable
    if (hasGuest && questionnaire.secondPersonEmail) {
      try {
        const { sendGuestRoomLink } = await import("@/lib/email");
        const { data: bookingDetails } = await admin
          .from("bookings")
          .select("services(name), diviners(display_name)")
          .eq("id", bookingId)
          .single();
        const sessionDateStr = new Date(
          booking.scheduled_at
        ).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        });
        const svc = bookingDetails?.services as unknown as {
          name: string;
        } | null;
        const div = bookingDetails?.diviners as unknown as {
          display_name: string;
        } | null;
        // For Chime, guest joins via the session page (same URL pattern)
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
        const guestRoomUrl = `${appUrl}/${questionnaire.divinerUsername ?? "session"}/session/${bookingId}`;
        await sendGuestRoomLink({
          guestEmail: questionnaire.secondPersonEmail,
          guestName: questionnaire.secondPersonName || "Guest",
          divinerName: div?.display_name || "Your Reader",
          serviceName: svc?.name || "Your Session",
          sessionDate: sessionDateStr,
          roomUrl: guestRoomUrl,
        });
      } catch (err) {
        console.error("Failed to send guest room link:", err);
      }
    }

    return NextResponse.json({
      meetingId: meeting.meetingId,
      externalMeetingId: meeting.externalMeetingId,
      attendeeId: divinerAttendee.attendeeId,
      joinToken: divinerAttendee.joinToken,
      mediaRegion: meeting.mediaRegion,
      pipelineId,
      recordingError: recordingError || null,
    });
  } catch (error) {
    console.error("Chime create meeting error:", error);
    return NextResponse.json(
      { error: "Failed to create Chime meeting" },
      { status: 502 }
    );
  }
}
