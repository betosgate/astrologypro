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

  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const admin = createAdminClient();

  const { data: booking, error } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_name, client_email, status, google_calendar_event_id"
    )
    .eq("id", id)
    .eq("admin_user_id", adminUser.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "canceled") {
    return NextResponse.json({ error: "Already canceled" }, { status: 422 });
  }

  const { error: updateError } = await admin
    .from("admin_bookings")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("admin_user_id", adminUser.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (booking.google_calendar_event_id) {
    import("@/lib/google-calendar")
      .then(({ deleteGoogleCalendarEvent }) =>
        deleteGoogleCalendarEvent(adminUser.id, booking.google_calendar_event_id!).catch(() => {})
      )
      .catch(() => {});
  }

  if (booking.client_email) {
    import("@/lib/email")
      .then(({ sendCancellationConfirmation }) =>
        sendCancellationConfirmation({
          to: booking.client_email,
          name: booking.client_name ?? "Client",
          divinerName: "Your host",
          serviceName: "Admin Calendar",
          cancelReason: body.reason,
          rebookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/admin/my-bookings`,
        }).catch(() => {})
      )
      .catch(() => {});
  }

  return NextResponse.json({ success: true });
}
