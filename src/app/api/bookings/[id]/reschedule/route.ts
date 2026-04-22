import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { resolveBookingViewer } from "@/lib/booking-access";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { scheduled_at: string; booking_token?: string };

  if (!body.scheduled_at) {
    return NextResponse.json({ error: "scheduled_at is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch the booking
  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id, diviner_id, client_id, service_id, status, duration_minutes, google_calendar_event_id, outlook_calendar_event_id, booking_token, scheduled_at, booking_notes, clients(full_name, email), diviners(id, display_name, username, user_id), services(name)")
    .eq("id", id)
    .single();

  if (bErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status === "canceled" || booking.status === "completed") {
    return NextResponse.json({ error: "Cannot reschedule a " + booking.status + " booking" }, { status: 422 });
  }

  // Auth: token-based OR authenticated user (client, diviner, or admin)
  let authorized = false;

  if (body.booking_token && body.booking_token === booking.booking_token) {
    authorized = true;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const adminUser = await getAdminUser();
      const access = await resolveBookingViewer(admin, id, user, !!adminUser);
      authorized = !!access;
    }
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Check the new slot is available (no other confirmed/pending booking at that time)
  const newStart = new Date(body.scheduled_at);
  const newEnd = new Date(newStart.getTime() + booking.duration_minutes * 60 * 1000);

  const { data: conflicts } = await admin
    .from("bookings")
    .select("id")
    .eq("diviner_id", booking.diviner_id)
    .in("status", ["confirmed", "pending", "in_progress"])
    .neq("id", id)
    .lt("scheduled_at", newEnd.toISOString())
    .gt("scheduled_at", new Date(newStart.getTime() - booking.duration_minutes * 60 * 1000).toISOString());

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: "That time slot is no longer available. Please choose another." }, { status: 409 });
  }

  // Update the booking
  const { error: updateError } = await admin
    .from("bookings")
    .update({ scheduled_at: body.scheduled_at, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Update Google Calendar event (fire and forget)
  if (booking.google_calendar_event_id) {
    import("@/lib/google-calendar").then(({ updateGoogleCalendarEvent }) => {
      updateGoogleCalendarEvent(booking.diviner_id, booking.google_calendar_event_id!, body.scheduled_at, booking.duration_minutes).catch(() => {});
    }).catch(() => {});
  }

  // Update Outlook Calendar event (fire and forget)
  if (booking.outlook_calendar_event_id) {
    import("@/lib/microsoft-calendar").then(({ updateMsCalendarEvent }) => {
      updateMsCalendarEvent(booking.diviner_id, booking.outlook_calendar_event_id!, body.scheduled_at, booking.duration_minutes).catch(() => {});
    }).catch(() => {});
  }

  // Send reschedule confirmation emails (fire and forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const manageUrl = `${appUrl}/booking/${booking.booking_token}`;
  const dashboardUrl = `${appUrl}/dashboard/bookings`;
  const formatDisplay = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  const newDateStr = formatDisplay(body.scheduled_at);
  const previousDateStr = formatDisplay(booking.scheduled_at);
  const clientEmail = (booking.clients as { email?: string } | null)?.email ?? "";
  const clientName = (booking.clients as { full_name?: string } | null)?.full_name ?? "Client";
  const divinerRecord = booking.diviners as { display_name?: string; user_id?: string } | null;
  const divinerName = divinerRecord?.display_name ?? "Your Practitioner";
  const serviceName = (booking.services as { name?: string } | null)?.name ?? "Session";

  if (clientEmail) {
    import("@/lib/email").then(({ sendRescheduleConfirmation }) => {
      sendRescheduleConfirmation({ to: clientEmail, name: clientName, divinerName, serviceName, newDate: newDateStr, manageUrl }).catch(() => {});
    }).catch(() => {});
  }

  // Notify the diviner so they see the calendar change (especially when the
  // client initiates the reschedule via their booking-token link).
  if (divinerRecord?.user_id) {
    (async () => {
      try {
        const { data: divinerAuth } = await admin.auth.admin.getUserById(divinerRecord.user_id!);
        const divinerEmail = divinerAuth?.user?.email;
        if (!divinerEmail) return;
        const { sendRescheduleNotificationToDiviner } = await import("@/lib/email");
        await sendRescheduleNotificationToDiviner({
          to: divinerEmail,
          divinerName,
          clientName,
          serviceName,
          previousDate: previousDateStr,
          newDate: newDateStr,
          dashboardUrl,
        });
      } catch {
        // fire-and-forget
      }
    })();
  }

  return NextResponse.json({ success: true });
}
