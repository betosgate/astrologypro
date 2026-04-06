import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookingManageClient } from "@/components/booking/booking-manage-client";

export const metadata = { robots: "noindex" };

export default async function BookingManagePage({
  params,
}: {
  params: Promise<{ uniqueId: string }>;
}) {
  const { uniqueId } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(`
      id, scheduled_at, duration_minutes, status, cancellation_reason,
      booking_token, booking_notes, daily_room_url,
      clients(full_name),
      services(name, description),
      diviners(display_name, username, avatar_url, timezone)
    `)
    .eq("booking_token", uniqueId)
    .single();

  if (!booking) notFound();

  // PostgREST join typing: cast to component's expected shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <BookingManageClient booking={booking as any} bookingToken={uniqueId} />;
}
