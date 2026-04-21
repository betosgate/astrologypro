import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings/[id]/pin
 *
 * Returns the booking's 6-digit call PIN and generation timestamp.
 * Admin-only. Logs the access to activity_log so we have a trail of
 * who-viewed-whose-PIN-when (the PIN is a secondary auth factor for
 * phone routing — access must be auditable).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      {
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Admin access required",
      },
      { status: 401 }
    );
  }

  const { id } = await params;

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("id, call_pin, call_pin_generated_at, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: error.message,
      },
      { status: 500 }
    );
  }

  if (!booking) {
    return Response.json(
      {
        type: "https://httpstatuses.com/404",
        title: "Not Found",
        status: 404,
        detail: "Booking not found",
      },
      { status: 404 }
    );
  }

  // Audit trail — fire-and-forget; logActivity swallows its own errors.
  logActivity({
    userId: user.id,
    eventCategory: "admin",
    eventType: "admin.booking.pin_viewed",
    metadata: { bookingId: id, hasPin: Boolean(booking.call_pin) },
  });

  return Response.json({
    booking_id: booking.id,
    call_pin: booking.call_pin ?? null,
    call_pin_generated_at: booking.call_pin_generated_at ?? null,
    status: booking.status ?? null,
  });
}
