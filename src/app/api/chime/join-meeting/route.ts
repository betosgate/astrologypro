import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createChimeAttendee } from "@/lib/chime-meetings";

export const dynamic = "force-dynamic";

/**
 * Creates a Chime attendee token for a user joining an existing meeting.
 * Used by clients (and guests) who join after the diviner has created the meeting.
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

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch booking with Chime meeting ID
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, chime_meeting_id, diviner_id, client_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking || !booking.chime_meeting_id) {
      return NextResponse.json(
        { error: "Booking or Chime meeting not found" },
        { status: 404 }
      );
    }

    // Verify user is either the diviner or the client for this booking
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const isDiviner = diviner && diviner.id === booking.diviner_id;
    const isClient = booking.client_id === user.id;

    if (!isDiviner && !isClient) {
      return NextResponse.json(
        { error: "Not authorized for this booking" },
        { status: 403 }
      );
    }

    const role = isDiviner ? "diviner" : "client";
    const externalUserId = isDiviner
      ? `diviner-${diviner.id}`
      : `client-${user.id}`;

    // Create attendee
    const attendee = await createChimeAttendee(
      booking.chime_meeting_id,
      externalUserId
    );

    // Store client token in video_sessions if client
    if (isClient) {
      await admin
        .from("video_sessions")
        .update({ client_token: attendee.joinToken })
        .eq("chime_meeting_id", booking.chime_meeting_id);
    }

    return NextResponse.json({
      meetingId: booking.chime_meeting_id,
      attendeeId: attendee.attendeeId,
      joinToken: attendee.joinToken,
      role,
    });
  } catch (error) {
    console.error("Chime join meeting error:", error);
    return NextResponse.json(
      { error: "Failed to join Chime meeting" },
      { status: 500 }
    );
  }
}
