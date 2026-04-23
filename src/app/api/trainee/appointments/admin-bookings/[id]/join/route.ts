import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleCalendarEventJoinUrl } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

/**
 * Trainee-side "Join" redirect for `admin_bookings` rows.
 *
 * Preferred target is the in-app Chime session page at
 * `/book/<admin-username>/session/<bookingId>`. We fall back to the
 * booking's Google Calendar Meet link only when the admin has no
 * username (so the session URL can't be built) AND a Calendar event
 * exists on the booking.
 *
 * Auth: supabase session whose email matches `admin_bookings.client_email`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authEmail = user.email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: booking, error } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_email, status, google_calendar_event_id, chime_meeting_id, video_provider",
    )
    .eq("id", id)
    .ilike("client_email", authEmail)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!["pending", "confirmed", "in_progress"].includes(booking.status)) {
    return NextResponse.json(
      { error: "This appointment cannot be joined right now." },
      { status: 422 },
    );
  }

  // Prefer the in-app Chime session page. The Chime meeting is created
  // lazily on first join, so this works even for bookings that don't yet
  // have `chime_meeting_id` populated.
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
        request.url,
      ),
      { status: 307 },
    );
  }

  // Fallback to Google Meet when the admin has no username.
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
    { error: "No meeting link is available yet. Please contact your host." },
    { status: 404 },
  );
}
