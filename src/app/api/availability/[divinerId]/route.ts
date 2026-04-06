import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/availability";
import { getAvailableSlotsFromGoogle } from "@/lib/google-calendar";
import { getMsFreeBusy } from "@/lib/microsoft-calendar";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ divinerId: string }> }
) {
  const { divinerId } = await params;
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const duration = searchParams.get("duration");

  if (!date || !duration) {
    return NextResponse.json(
      { error: "Missing required query params: date, duration" },
      { status: 400 }
    );
  }

  const durationMinutes = parseInt(duration, 10);
  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json(
      { error: "Invalid duration" },
      { status: 400 }
    );
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Fetch diviner timezone
    const { data: diviner } = await supabase
      .from("diviners")
      .select("timezone")
      .eq("id", divinerId)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found" },
        { status: 404 }
      );
    }

    // Fetch weekly availability slots (active only)
    const { data: weeklySlots } = await supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time")
      .eq("diviner_id", divinerId)
      .eq("is_active", true);

    // Fetch overrides for the given date
    const { data: overrides } = await supabase
      .from("availability_overrides")
      .select("date, is_available, start_time, end_time")
      .eq("diviner_id", divinerId)
      .eq("date", date);

    // Fetch existing bookings for the date
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("scheduled_at, duration_minutes")
      .eq("diviner_id", divinerId)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .in("status", ["pending", "confirmed", "in_progress"]);

    // Also treat active holds as booked (prevents race-condition double-booking)
    const { data: holds } = await admin
      .from("booking_holds")
      .select("scheduled_at, duration_minutes")
      .eq("diviner_id", divinerId)
      .gt("expires_at", new Date().toISOString())
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd);

    // Fetch external calendar busy slots in parallel (Google + Outlook)
    const [googleBusy, outlookBusy] = await Promise.all([
      getAvailableSlotsFromGoogle(divinerId, new Date(date)).catch(() => []),
      getMsFreeBusy(divinerId, date).catch(() => []),
    ]);
    const externalBusy = [...googleBusy, ...outlookBusy];

    const allBlockedSlots = [
      ...(bookings ?? []).map((b) => ({
        start: b.scheduled_at,
        end: new Date(
          new Date(b.scheduled_at).getTime() + b.duration_minutes * 60_000
        ).toISOString(),
      })),
      ...(holds ?? []).map((h) => ({
        start: h.scheduled_at,
        end: new Date(
          new Date(h.scheduled_at).getTime() + (h.duration_minutes ?? 60) * 60_000
        ).toISOString(),
      })),
      ...externalBusy,
    ];

    const slots = getAvailableSlots({
      date,
      weeklySlots: (weeklySlots ?? []).map((s) => ({
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time,
      })),
      bookedSlots: allBlockedSlots,
      overrides: (overrides ?? []).map((o) => ({
        date: o.date,
        isAvailable: o.is_available,
        startTime: o.start_time ?? undefined,
        endTime: o.end_time ?? undefined,
      })),
      durationMinutes,
      timezone: diviner.timezone ?? "America/New_York",
    });

    return NextResponse.json(slots);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
