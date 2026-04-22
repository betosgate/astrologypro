import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { resolveBookingViewer } from "@/lib/booking-access";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { reason?: string; booking_token?: string };
  const admin = createAdminClient();

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id, diviner_id, client_id, status, duration_minutes, google_calendar_event_id, outlook_calendar_event_id, booking_token, scheduled_at, questionnaire_responses, metadata, clients(full_name, email), diviners(display_name, username, user_id), services(name)")
    .eq("id", id)
    .single();

  if (bErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "canceled") return NextResponse.json({ error: "Already canceled" }, { status: 422 });
  if (booking.status === "completed") return NextResponse.json({ error: "Cannot cancel a completed booking" }, { status: 422 });

  // Auth: token OR authenticated client/diviner/admin
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

  // Update booking status
  await admin.from("bookings").update({
    status: "canceled",
    canceled_at: new Date().toISOString(),
    cancellation_reason: body.reason ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  // Delete calendar events (fire and forget)
  if (booking.google_calendar_event_id) {
    import("@/lib/google-calendar").then(({ deleteGoogleCalendarEvent }) => {
      deleteGoogleCalendarEvent(booking.diviner_id, booking.google_calendar_event_id!).catch(() => {});
    }).catch(() => {});
  }
  if (booking.outlook_calendar_event_id) {
    import("@/lib/microsoft-calendar").then(({ deleteMsCalendarEvent }) => {
      deleteMsCalendarEvent(booking.diviner_id, booking.outlook_calendar_event_id!).catch(() => {});
    }).catch(() => {});
  }

  // Send cancellation emails to all attendees (fire and forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const clientEmail = (booking.clients as { email?: string } | null)?.email ?? "";
  const clientName = (booking.clients as { full_name?: string } | null)?.full_name ?? "Client";
  const divinerName = (booking.diviners as { display_name?: string } | null)?.display_name ?? "Your Practitioner";
  const meta = (booking as Record<string, unknown>).metadata as { availability_title?: string } | null;
  const serviceName = meta?.availability_title ?? (booking.services as { name?: string } | null)?.name ?? "Session";
  const rebookUrl = `${appUrl}/${(booking.diviners as { username?: string } | null)?.username ?? ""}`;

  // Gather all recipient emails
  const qr = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
  const cancelRecipients: Array<{ email: string; name: string }> = [];
  if (clientEmail) {
    cancelRecipients.push({ email: clientEmail, name: clientName });
  }
  const spEmail = qr?.secondPersonEmail as string | undefined;
  const spName = qr?.secondPersonName as string | undefined;
  const spAttending = qr?.secondPersonAttending as string | undefined;
  if (spEmail && (spAttending === "yes" || spAttending === "maybe")) {
    if (!cancelRecipients.some((r) => r.email === spEmail)) {
      cancelRecipients.push({ email: spEmail, name: spName || "Guest" });
    }
  }
  const storedAttendees = Array.isArray(qr?.attendees) ? (qr.attendees as Array<{ name?: string; email?: string }>) : [];
  for (const a of storedAttendees) {
    if (a.email && !cancelRecipients.some((r) => r.email === a.email)) {
      cancelRecipients.push({ email: a.email, name: a.name || a.email });
    }
  }

  if (cancelRecipients.length > 0) {
    import("@/lib/email").then(({ sendCancellationConfirmation }) => {
      for (const recipient of cancelRecipients) {
        sendCancellationConfirmation({
          to: recipient.email,
          name: recipient.name,
          divinerName,
          serviceName,
          cancelReason: body.reason,
          rebookUrl,
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  // Notify the diviner that a booking was cancelled. This is essential when
  // the client cancels via their booking-token link — otherwise the diviner
  // would only find out by refreshing the dashboard.
  const divinerUserId = (booking.diviners as { user_id?: string } | null)?.user_id;
  if (divinerUserId) {
    (async () => {
      try {
        const { data: divinerAuth } = await admin.auth.admin.getUserById(divinerUserId);
        const divinerEmail = divinerAuth?.user?.email;
        if (!divinerEmail) return;
        const scheduledAtDisplay = new Date(booking.scheduled_at).toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const dashboardUrl = `${appUrl}/dashboard/bookings`;
        const { sendCancellationNotificationToDiviner } = await import("@/lib/email");
        await sendCancellationNotificationToDiviner({
          to: divinerEmail,
          divinerName,
          clientName,
          serviceName,
          scheduledAt: scheduledAtDisplay,
          cancelReason: body.reason,
          dashboardUrl,
        });
      } catch {
        // fire-and-forget
      }
    })();
  }

  return NextResponse.json({ success: true });
}
