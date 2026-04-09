import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/availability";
import { getAvailableSlotsFromGoogle } from "@/lib/google-calendar";
import { getMsFreeBusy } from "@/lib/microsoft-calendar";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const { ownerId } = await params;
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const duration = searchParams.get("duration");
  const serviceId = searchParams.get("serviceId");

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
    const admin = createAdminClient();

    // Fetch diviner timezone
    const { data: diviner } = await admin
      .from("diviners")
      .select("timezone")
      .eq("id", ownerId)
      .single();
// Note: We use admin client here because this is a public fetch of a profile's timezone

    if (!diviner) {
      return NextResponse.json(
        { error: "Diviner not found" },
        { status: 404 }
      );
    }

    // Check calendar connections for this owner
    const { data: connections } = await admin
      .from("calendar_connections")
      .select("provider")
      .eq("owner_id", ownerId);

    const isGoogleConnected = connections?.some(c => c.provider === "google");
    const isOutlookConnected = connections?.some(c => c.provider === "microsoft");

    // New date-ranged schedules created from the dashboard.
    const { data: templates } = await admin
      .from("availability_templates")
      .select("id, title, service_id, start_date, end_date, weekdays, start_time, end_time, timezone, duration_minutes, description, is_active")
      .or(`owner_id.eq.${ownerId},diviner_id.eq.${ownerId}`)
      .eq("is_active", true);

    // Legacy recurring slots kept as a fallback while older data is still present.
    const { data: weeklySlots } = await admin
      .from("availability_slots")
      .select("day_of_week, start_time, end_time")
      .or(`owner_id.eq.${ownerId},diviner_id.eq.${ownerId}`)
      .eq("is_active", true);

    // Fetch overrides for the given date
    const { data: overrides } = await admin
      .from("availability_overrides")
      .select("date, is_available, start_time, end_time")
      .or(`owner_id.eq.${ownerId},diviner_id.eq.${ownerId}`)
      .eq("date", date);

    // Query a widened UTC range so timezone-converted schedule windows
    // near midnight are still blocked correctly.
    const selectedDayUtc = new Date(`${date}T00:00:00.000Z`);
    const queryStart = new Date(selectedDayUtc.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const queryEnd = new Date(selectedDayUtc.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const { data: bookings } = await admin
      .from("bookings")
      .select("scheduled_at, duration_minutes")
      .eq("owner_id", ownerId)
      .gte("scheduled_at", queryStart)
      .lte("scheduled_at", queryEnd)
      .in("status", ["pending", "confirmed", "in_progress"]);

    // Also treat active holds as booked (prevents race-condition double-booking)
    const { data: holds } = await admin
      .from("booking_holds")
      .select("scheduled_at, duration_minutes")
      .eq("owner_id", ownerId)
      .gt("expires_at", new Date().toISOString())
      .gte("scheduled_at", queryStart)
      .lte("scheduled_at", queryEnd);

    // Fetch external calendar busy slots only when the diviner has connected
    // Each call is individually guarded and caught so a missing token never
    // blocks the internal availability calculation.
    let externalBusy: { start: string; end: string }[] = [];
    try {
      const [googleBusy, outlookBusy] = await Promise.all([
        isGoogleConnected
          ? getAvailableSlotsFromGoogle(ownerId, new Date(`${date}T12:00:00.000Z`)).catch(() => [] as { start: string; end: string }[])
          : Promise.resolve([] as { start: string; end: string }[]),
        isOutlookConnected
          ? getMsFreeBusy(ownerId, date).catch(() => [] as { start: string; end: string }[])
          : Promise.resolve([] as { start: string; end: string }[]),
      ]);
      externalBusy = [...googleBusy, ...outlookBusy];
    } catch {
      // External calendar unavailable — proceed with internal data only
    }

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
      templates: (templates ?? []).map((template) => ({
        id: template.id,
        title: template.title,
        serviceId: template.service_id ?? null,
        startDate: template.start_date,
        endDate: template.end_date,
        weekdays: template.weekdays ?? [],
        startTime: template.start_time,
        endTime: template.end_time,
        timezone: template.timezone,
        durationMinutes: template.duration_minutes,
        description: template.description ?? null,
        isActive: template.is_active,
      })),
      serviceId,
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
