import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendSessionReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const now = new Date();

  // 24h window: bookings scheduled between 23h and 25h from now
  const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // 1h window: bookings scheduled between 50min and 70min from now
  const window1hStart = new Date(now.getTime() + 50 * 60 * 1000).toISOString();
  const window1hEnd = new Date(now.getTime() + 70 * 60 * 1000).toISOString();

  const [{ data: bookings24h }, { data: bookings1h }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, scheduled_at, duration_minutes, booking_token, daily_room_url, clients(full_name, email), diviners(display_name, timezone), services(name)"
      )
      .eq("status", "confirmed")
      .gte("scheduled_at", window24hStart)
      .lte("scheduled_at", window24hEnd),
    admin
      .from("bookings")
      .select(
        "id, scheduled_at, duration_minutes, booking_token, daily_room_url, clients(full_name, email), diviners(display_name, timezone), services(name)"
      )
      .eq("status", "confirmed")
      .gte("scheduled_at", window1hStart)
      .lte("scheduled_at", window1hEnd),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const sent: string[] = [];
  const errors: string[] = [];

  const processBookings = async (
    bookings: typeof bookings24h,
    label: string
  ) => {
    for (const b of bookings ?? []) {
      try {
        const client = b.clients as { full_name?: string; email?: string } | null;
        const diviner = b.diviners as { display_name?: string; timezone?: string } | null;
        const service = b.services as { name?: string } | null;
        if (!client?.email) continue;
        await sendSessionReminder({
          to: client.email,
          name: client.full_name ?? "Client",
          divinerName: diviner?.display_name ?? "Your Practitioner",
          serviceName: service?.name ?? "Session",
          scheduledAt: b.scheduled_at,
          timezone: diviner?.timezone ?? "America/New_York",
          joinUrl: b.daily_room_url ?? undefined,
          manageUrl: `${appUrl}/booking/${b.booking_token}`,
        });
        sent.push(`${label}:${b.id}`);
      } catch (e) {
        errors.push(`${label}:${b.id}:${e}`);
      }
    }
  };

  await processBookings(bookings24h, "24h");
  await processBookings(bookings1h, "1h");

  return NextResponse.json({ sent, errors, at: now.toISOString() });
}
