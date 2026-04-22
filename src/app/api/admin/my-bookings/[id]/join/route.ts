import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleCalendarEventJoinUrl } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

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
    .select("id, admin_user_id, status, google_calendar_event_id")
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

  if (!booking.google_calendar_event_id) {
    return NextResponse.json(
      { error: "No meeting link is available for this booking yet." },
      { status: 404 },
    );
  }

  const joinUrl = await getGoogleCalendarEventJoinUrl(
    booking.admin_user_id,
    booking.google_calendar_event_id,
  );

  if (!joinUrl) {
    return NextResponse.json(
      { error: "No meeting link is available for this booking yet." },
      { status: 404 },
    );
  }

  return NextResponse.redirect(joinUrl, { status: 307 });
}
