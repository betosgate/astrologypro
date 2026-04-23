import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createChimeAttendee,
  createChimeMeeting,
  getChimeMeeting,
  listChimeAttendees,
} from "@/lib/chime-meetings";

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
        "id, admin_user_id, client_name, client_email, scheduled_at, duration_minutes, status, chime_meeting_id, chime_external_meeting_id, video_provider",
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const attendee = await createChimeAttendee(activeMeetingId!, externalUserId);

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

    // admin_bookings has no `session_started_at` column — return the
    // current timestamp so the client-side timer has a deterministic start
    // (the server-persisted value is a diviner-table concept).
    const sessionStartedAt = new Date().toISOString();

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
