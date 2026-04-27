import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleCalendarEventJoinUrl } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

/**
 * Admin-side "Join" redirect for `admin_bookings` rows.
 *
 * Preferred target is the in-app Chime session page at
 * `/book/<admin-username>/session/<bookingId>`. We fall back to the
 * booking's Google Calendar Meet link only when the admin has no
 * username (so the session URL can't be built) AND a Calendar event
 * exists on the booking.
 *
 * This used to redirect to Google Meet only, which meant bookings
 * created without Google Calendar integration (the Chime-only flow)
 * always 404'd here.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, status, google_calendar_event_id, chime_meeting_id, video_provider",
    )
    .eq("id", id)
    .eq("admin_user_id", adminUser.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!["pending", "confirmed", "in_progress"].includes(booking.status)) {
    return NextResponse.json(
      { error: "This booking cannot be joined right now." },
      { status: 422 },
    );
  }

  // Prefer the in-app Chime session page. It works for every admin_bookings
  // row (the Chime meeting is lazily created on first join) and no longer
  // requires Google Calendar to be connected for a Join link to exist.
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("username")
    .eq("user_id", booking.admin_user_id)
    .maybeSingle();

  const adminUsername = (adminRow?.username as string | null) ?? null;
  if (adminUsername) {
    return NextResponse.redirect(
      new URL(
        `/book/${encodeURIComponent(adminUsername)}/session/${booking.id}`,
        _request.url,
      ),
      { status: 307 },
    );
  }

  // Fallback: no admin username, so the session page URL can't be built.
  // If a Google Calendar event is attached, send them to the Meet link.
  if (booking.google_calendar_event_id) {
    const joinUrl = await getGoogleCalendarEventJoinUrl(
      booking.admin_user_id,
      booking.google_calendar_event_id,
    );
    if (joinUrl) {
      return NextResponse.redirect(joinUrl, { status: 307 });
    }
  }

  return NextResponse.json(
    {
      error:
        "No meeting link is available yet. Ask the host admin to set a username at /admin/settings or connect Google Calendar.",
    },
    { status: 404 },
  );
}
