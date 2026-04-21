import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookingManageClient } from "@/components/booking/booking-manage-client";
import { getActiveCentralChimeNumber } from "@/lib/booking-call-pin";

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
      call_pin, call_pin_generated_at,
      clients(full_name),
      services(name, description),
      diviners(display_name, username, avatar_url, timezone)
    `)
    .eq("booking_token", uniqueId)
    .single();

  if (!booking) notFound();

  // Resolve central phone number only when the booking has a PIN.
  // Gate is data-driven: if an active row exists in chime_central_numbers
  // (returned by getActiveCentralChimeNumber) AND the booking has a PIN,
  // advertise the central-number + PIN card. Otherwise the client falls
  // back to the existing join flow unchanged.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any;
  const callPin: string | null = b.call_pin ?? null;
  let centralPhoneNumber: string | null = null;

  if (callPin) {
    const central = await getActiveCentralChimeNumber(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      admin as any
    );
    centralPhoneNumber = central?.phoneNumber ?? null;
  }

  return (
    <BookingManageClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      booking={booking as any}
      bookingToken={uniqueId}
      centralPhoneNumber={centralPhoneNumber}
      callPin={centralPhoneNumber ? callPin : null}
    />
  );
}
