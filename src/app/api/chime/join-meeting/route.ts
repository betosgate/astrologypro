import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChimeAttendee,
  createChimeMeeting,
  getChimeMeeting,
  listChimeAttendees,
  startChimeRecording,
} from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * Creates a Chime attendee token for a user joining an existing meeting.
 * Used by clients (and guests) who join after the diviner has created the meeting.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { bookingId, clientToken } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    let role: "diviner" | "client";
    let externalUserId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let booking: any;

    // ── Token-based access: unauthenticated client join ───────────────────────
    if (clientToken) {
      const { data, error } = await admin
        .from("bookings")
        .select("id, chime_meeting_id, chime_pipeline_id, diviner_id, client_id, booking_token, diviners(display_name), clients(full_name, id)")
        .eq("id", bookingId)
        .eq("booking_token", clientToken)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Invalid session token" }, { status: 403 });
      }

      booking = data as any;
      role = "client";

      const clientObj = Array.isArray((booking as any).clients)
        ? (booking as any).clients[0]
        : (booking as any).clients;
      externalUserId = `client-${clientObj?.id ?? (booking as any).client_id}`;

    // ── Auth-based access: diviner or authenticated client ────────────────────
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data, error: bookingError } = await admin
        .from("bookings")
        .select("id, chime_meeting_id, chime_pipeline_id, diviner_id, client_id, diviners(display_name), clients(full_name, id)")
        .eq("id", bookingId)
        .single();

      if (bookingError || !data) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      booking = data as any;

      const [{ data: diviner }, { data: client }] = await Promise.all([
        admin.from("diviners").select("id, display_name").eq("user_id", user.id).maybeSingle(),
        admin.from("clients").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const isDiviner = diviner && diviner.id === (booking as any).diviner_id;
      const isClient = client && client.id === (booking as any).client_id;

      if (!isDiviner && !isClient) {
        return NextResponse.json(
          { error: "You are not authorized for this session" },
          { status: 403 }
        );
      }

      role = isDiviner ? "diviner" : "client";
      externalUserId = isDiviner
        ? `diviner-${diviner!.id}`
        : `client-${client!.id}`;
    }

    // Reuse existing meeting if it's still alive on AWS; create fresh if stale/missing
    let activeMeetingId = booking.chime_meeting_id;
    let meeting;

    if (activeMeetingId) {
      try {
        meeting = await getChimeMeeting(activeMeetingId);
      } catch {
        // Meeting is stale/ended on AWS — will create fresh below
        activeMeetingId = null;
      }
    }

    if (!activeMeetingId) {
      const fresh = await createChimeMeeting(bookingId, 60, 5);
      activeMeetingId = fresh.meetingId;

      await admin
        .from("bookings")
        .update({
          chime_meeting_id: activeMeetingId,
          chime_external_meeting_id: fresh.externalMeetingId,
          video_provider: "chime",
        })
        .eq("id", bookingId);

      meeting = await getChimeMeeting(activeMeetingId);
    }

    const attendee = await createChimeAttendee(activeMeetingId, externalUserId);

    // Start recording when diviner joins and no pipeline exists yet.
    // This covers: (a) fresh meetings created above, (b) existing meetings
    // where recording was never started (e.g. bucket was misconfigured before).
    if (role === "diviner" && !booking.chime_pipeline_id) {
      try {
        const recording = await startChimeRecording(
          activeMeetingId,
          `recordings/${bookingId}`
        );
        if (recording.pipelineArn) {
          console.log(`[join-meeting] Recording pipeline started: id=${recording.pipelineId} arn=${recording.pipelineArn}`);
          await admin
            .from("bookings")
            .update({ chime_pipeline_id: recording.pipelineArn })
            .eq("id", bookingId);
        } else {
          console.warn("[join-meeting] startChimeRecording returned empty pipelineArn");
        }
      } catch (err: unknown) {
        const name = (err as { name?: string }).name ?? "Error";
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[join-meeting] Failed to start recording: ${name}: ${msg}`);
      }
    }

    // Fetch + set session_started_at (column added via migration — graceful fallback if missing)
    let sessionStartedAt: string = new Date().toISOString();
    try {
      const { data: sessionRow } = await admin
        .from("bookings")
        .select("session_started_at")
        .eq("id", bookingId)
        .single();

      if (sessionRow?.session_started_at) {
        sessionStartedAt = sessionRow.session_started_at;
      } else {
        // First join — persist the start time
        await admin
          .from("bookings")
          .update({ session_started_at: sessionStartedAt })
          .eq("id", bookingId)
          .is("session_started_at", null);
      }
    } catch {
      // Column not yet migrated — timer starts fresh; run migration to persist across reloads
    }

    // Check if a diviner attendee is already in the Chime meeting.
    // This lets the client skip the waiting room immediately instead of
    // relying on the presence callback replaying (which can be unreliable).
    let divinerPresent = role === "diviner"; // diviner is always "present" to themselves
    if (role === "client") {
      try {
        const existingAttendees = await listChimeAttendees(activeMeetingId!);
        divinerPresent = existingAttendees.some(
          (a) =>
            a.externalUserId.startsWith("diviner-") &&
            a.attendeeId !== attendee.attendeeId
        );
      } catch {
        // If the AWS call fails, fall back to false — client will see the
        // waiting room but the SDK presence callback will still clear it.
      }
    }

    // Build participant names
    const divinerObj = Array.isArray(booking.diviners)
      ? booking.diviners[0]
      : booking.diviners;
    const clientObj = Array.isArray(booking.clients)
      ? booking.clients[0]
      : booking.clients;

    return NextResponse.json({
      meeting: {
        MeetingId: meeting!.MeetingId,
        MediaPlacement: meeting!.MediaPlacement,
        MediaRegion: meeting!.MediaRegion,
      },
      attendee: {
        AttendeeId: attendee.attendeeId,
        JoinToken: attendee.joinToken,
      },
      role,
      sessionStartedAt,
      divinerPresent,
      participants: {
        divinerName: (divinerObj as any)?.display_name ?? "Diviner",
        clientName: (clientObj as any)?.full_name ?? "Client",
      },
    });
  } catch (error) {
    console.error("Chime join meeting error:", error);
    return NextResponse.json(
      { error: "Failed to join Chime meeting" },
      { status: 500 }
    );
  }
}
