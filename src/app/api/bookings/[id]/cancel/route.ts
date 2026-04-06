import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { reason?: string; booking_token?: string };
  const admin = createAdminClient();

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("id, diviner_id, client_id, status, duration_minutes, google_calendar_event_id, outlook_calendar_event_id, booking_token, scheduled_at, clients(full_name, email), diviners(display_name, username), services(name)")
    .eq("id", id)
    .single();

  if (bErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "canceled") return NextResponse.json({ error: "Already canceled" }, { status: 422 });
  if (booking.status === "completed") return NextResponse.json({ error: "Cannot cancel a completed booking" }, { status: 422 });

  // Auth: token OR authenticated
  let authorized = false;
  if (body.booking_token && body.booking_token === booking.booking_token) {
    authorized = true;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (booking.client_id === user.id) authorized = true;
      const { data: diviner } = await admin.from("diviners").select("id").eq("user_id", user.id).single();
      if (diviner?.id === booking.diviner_id) authorized = true;
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

  // Send cancellation email (fire and forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const clientEmail = (booking.clients as { email?: string } | null)?.email ?? "";
  const clientName = (booking.clients as { full_name?: string } | null)?.full_name ?? "Client";
  const divinerName = (booking.diviners as { display_name?: string } | null)?.display_name ?? "Your Practitioner";
  const serviceName = (booking.services as { name?: string } | null)?.name ?? "Session";

  if (clientEmail) {
    import("@/lib/email").then(({ sendCancellationConfirmation }) => {
      sendCancellationConfirmation({
        to: clientEmail,
        name: clientName,
        divinerName,
        serviceName,
        cancelReason: body.reason,
        rebookUrl: `${appUrl}/${(booking.diviners as { username?: string } | null)?.username ?? ""}`,
      }).catch(() => {});
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
