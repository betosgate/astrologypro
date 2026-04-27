import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorize: the admin who owns this booking, OR the authenticated
  // client whose email matches the booking's client_email. This lets
  // both the admin dashboard (`/admin/my-bookings`) and the trainee
  // dashboard (`/trainee`) share the same reschedule endpoint.
  const adminUser = await getAdminUser();
  let authorized = !!adminUser && adminUser.id === booking.admin_user_id;
  if (!authorized) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const authEmail = user?.email?.trim().toLowerCase() ?? null;
    const bookingEmail = (booking.client_email ?? "").trim().toLowerCase();
    if (authEmail && bookingEmail && authEmail === bookingEmail) {
      authorized = true;
    }
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    .eq("admin_user_id", booking.admin_user_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (booking.google_calendar_event_id && booking.admin_user_id) {
    const adminUserIdForGcal = booking.admin_user_id as string;
    import("@/lib/google-calendar")
      .then(({ updateGoogleCalendarEvent }) =>
        updateGoogleCalendarEvent(
          adminUserIdForGcal,
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
