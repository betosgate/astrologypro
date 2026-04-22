import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { scheduled_at?: string };
  if (!body.scheduled_at) {
    return NextResponse.json({ error: "scheduled_at is required" }, { status: 422 });
  }

  const scheduledAt = new Date(body.scheduled_at);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduled_at" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_name, client_email, scheduled_at, duration_minutes, timezone, status, google_calendar_event_id"
    )
    .eq("id", id)
    .eq("admin_user_id", adminUser.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "canceled") {
    return NextResponse.json({ error: "Cannot reschedule a canceled booking" }, { status: 422 });
  }

  const { error: updateError } = await admin
    .from("admin_bookings")
    .update({
      scheduled_at: body.scheduled_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("admin_user_id", adminUser.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (booking.google_calendar_event_id) {
    import("@/lib/google-calendar")
      .then(({ updateGoogleCalendarEvent }) =>
        updateGoogleCalendarEvent(
          adminUser.id,
          booking.google_calendar_event_id!,
          body.scheduled_at!,
          Number(booking.duration_minutes) || 60
        ).catch(() => {})
      )
      .catch(() => {});
  }

  const newDateStr = scheduledAt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: booking.timezone ?? "UTC",
    timeZoneName: "short",
  });

  if (booking.client_email) {
    import("@/lib/email")
      .then(({ sendRescheduleConfirmation }) =>
        sendRescheduleConfirmation({
          to: booking.client_email,
          name: booking.client_name ?? "Client",
          divinerName: "Your host",
          serviceName: "Admin Calendar",
          newDate: newDateStr,
          manageUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/admin/my-bookings`,
        }).catch(() => {})
      )
      .catch(() => {});
  }

  return NextResponse.json({ success: true });
}
