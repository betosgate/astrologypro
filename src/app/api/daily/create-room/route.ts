import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Fetch the booking to get scheduled time and verify ownership
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, scheduled_at, diviner_id, client_id, status, questionnaire")
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

    const questionnaire = ((booking as Record<string, unknown>).questionnaire ?? {}) as Record<string, string>;
    const hasGuest = questionnaire.secondPersonAttending === "yes" || questionnaire.secondPersonAttending === "maybe";

    // Calculate expiration: scheduled time + duration + 30 min buffer
    const scheduledAt = new Date(booking.scheduled_at);
    const bufferMinutes = 30;
    const expSeconds = Math.floor(
      (scheduledAt.getTime() +
        (duration + bufferMinutes) * 60 * 1000) /
        1000
    );

    // Create Daily.co room via REST API
    const roomName = `astropro-${bookingId.slice(0, 8)}-${Date.now()}`;

    const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_recording: "cloud",
          enable_screenshare: true,
          max_participants: hasGuest ? 3 : 2,
          exp: expSeconds,
          enable_chat: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!dailyResponse.ok) {
      const dailyError = await dailyResponse.text();
      console.error("Daily.co room creation failed:", dailyError);
      return NextResponse.json(
        { error: "Failed to create video room" },
        { status: 502 }
      );
    }

    const room = await dailyResponse.json();
    const roomUrl: string = room.url;

    // Update booking with room details
    const { error: updateError } = await admin
      .from("bookings")
      .update({
        daily_room_name: room.name,
        daily_room_url: roomUrl,
        status: "confirmed",
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking with room info:", updateError);
    }

    // Send room link to guest
    const guestEmail = questionnaire.secondPersonEmail;
    if (guestEmail && hasGuest) {
      try {
        const { sendGuestRoomLink } = await import("@/lib/email");
        const { data: bookingDetails } = await admin
          .from("bookings")
          .select("services(name), diviners(display_name)")
          .eq("id", bookingId)
          .single();
        const sessionDateStr = new Date(booking.scheduled_at).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "numeric", minute: "2-digit", timeZoneName: "short",
        });
        const svc = bookingDetails?.services as { name: string } | null;
        const div = bookingDetails?.diviners as { display_name: string } | null;
        await sendGuestRoomLink({
          guestEmail,
          guestName: questionnaire.secondPersonName || "Guest",
          divinerName: div?.display_name || "Your Reader",
          serviceName: svc?.name || "Your Session",
          sessionDate: sessionDateStr,
          roomUrl,
        });
      } catch (err) {
        console.error("Failed to send guest room link:", err);
      }
    }

    return NextResponse.json({ roomUrl, roomName: room.name });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
