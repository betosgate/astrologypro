import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/availability";
import { getGoogleBusyScheduleInRange } from "@/lib/google-calendar";
import { getMsFreeBusyInRange } from "@/lib/microsoft-calendar";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  const { ownerId } = await params;
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const duration = searchParams.get("duration");
  const serviceId = searchParams.get("serviceId");

  if (!month || !duration) {
    return NextResponse.json(
      { error: "Missing required query params: month, duration" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month format. Use YYYY-MM" },
      { status: 400 }
    );
  }

  const durationMinutes = parseInt(duration, 10);
  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  try {
    const [year, monthIndex] = month.split("-").map(Number);
    const startOfMonth = new Date(Date.UTC(year, monthIndex - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, monthIndex, 0));
    const monthStart = formatDate(startOfMonth);
    const monthEnd = formatDate(endOfMonth);

    const admin = createAdminClient();
    const { data: diviner } = await admin
      .from("diviners")
      .select("user_id, google_calendar_token, outlook_calendar_token")
      .eq("id", ownerId)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    const connectionFilters = [`owner_id.eq.${ownerId}`];
    if (diviner.user_id) {
      connectionFilters.push(`user_id.eq.${diviner.user_id}`);
    }

    const { data: connections } = await admin
      .from("calendar_connections")
      .select("provider")
      .or(connectionFilters.join(","));

    const isGoogleConnected =
      connections?.some((connection) => connection.provider === "google") ||
      Boolean(diviner.google_calendar_token);
    const isOutlookConnected =
      connections?.some((connection) => connection.provider === "microsoft") ||
      Boolean(diviner.outlook_calendar_token);

    const [{ data: templates }, { data: weeklySlots }, { data: overrides }] =
      await Promise.all([
        admin
          .from("availability_templates")
          .select("*")
          .or(`owner_id.eq.${ownerId},diviner_id.eq.${ownerId}`)
          .eq("is_active", true),
        admin
          .from("availability_slots")
          .select("day_of_week, start_time, end_time")
          .or(`owner_id.eq.${ownerId},diviner_id.eq.${ownerId}`)
          .eq("is_active", true),
        admin
          .from("availability_overrides")
          .select("date, is_available, start_time, end_time")
          .or(`owner_id.eq.${ownerId},diviner_id.eq.${ownerId}`)
          .gte("date", monthStart)
          .lte("date", monthEnd),
      ]);

    const templateTimezoneCandidates = (templates ?? [])
      .filter((template) => {
        const record = template as Record<string, unknown>;
        const templateServiceId =
          typeof record.service_id === "string" ? record.service_id : null;

        if (serviceId) return templateServiceId === serviceId;
        return !templateServiceId;
      })
      .map((template) => String((template as Record<string, unknown>).timezone ?? ""))
      .filter(Boolean);

    const primaryScheduleTimezone = templateTimezoneCandidates[0] ?? "UTC";

    const queryStart = new Date(startOfMonth.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const queryEnd = new Date(endOfMonth.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const [{ data: bookings }, { data: holds }, googleBusy, outlookBusy] =
      await Promise.all([
        admin
          .from("bookings")
          .select("scheduled_at, duration_minutes")
          .eq("owner_id", ownerId)
          .gte("scheduled_at", queryStart)
          .lte("scheduled_at", queryEnd)
          .in("status", ["pending", "confirmed", "in_progress"]),
        admin
          .from("booking_holds")
          .select("scheduled_at, duration_minutes")
          .eq("owner_id", ownerId)
          .gt("expires_at", new Date().toISOString())
          .gte("scheduled_at", queryStart)
          .lte("scheduled_at", queryEnd),
        isGoogleConnected
          ? getGoogleBusyScheduleInRange(
              ownerId,
              queryStart,
              queryEnd,
              primaryScheduleTimezone
            ).catch(() => [])
          : Promise.resolve([]),
        isOutlookConnected
          ? getMsFreeBusyInRange(ownerId, queryStart, queryEnd).catch(() => [])
          : Promise.resolve([]),
      ]);

    const allBlockedSlots = [
      ...(bookings ?? []).map((booking) => ({
        start: booking.scheduled_at,
        end: new Date(
          new Date(booking.scheduled_at).getTime() +
            booking.duration_minutes * 60_000
        ).toISOString(),
      })),
      ...(holds ?? []).map((hold) => ({
        start: hold.scheduled_at,
        end: new Date(
          new Date(hold.scheduled_at).getTime() +
            (hold.duration_minutes ?? 60) * 60_000
        ).toISOString(),
      })),
      ...googleBusy.map((entry) => ({ start: entry.start, end: entry.end })),
      ...outlookBusy,
    ];

    const availableDates: string[] = [];

    for (
      let cursor = new Date(startOfMonth);
      cursor <= endOfMonth;
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const date = formatDate(cursor);

      const slots = getAvailableSlots({
        date,
        templates: (templates ?? []).map((template) => {
          const record = template as Record<string, unknown>;
          return {
            id: String(record.id ?? ""),
            title: String(record.title ?? "Available"),
            serviceId:
              typeof record.service_id === "string" ? record.service_id : null,
            startDate: String(record.start_date ?? ""),
            endDate: String(record.end_date ?? ""),
            weekdays: Array.isArray(record.weekdays)
              ? (record.weekdays as number[])
              : [],
            startTime: String(record.start_time ?? ""),
            endTime: String(record.end_time ?? ""),
            timezone: String(record.timezone ?? primaryScheduleTimezone),
            durationMinutes:
              typeof record.duration_minutes === "number"
                ? record.duration_minutes
                : durationMinutes,
            description:
              typeof record.description === "string" ? record.description : null,
            isActive: record.is_active !== false,
          };
        }),
        serviceId,
        weeklySlots: (weeklySlots ?? []).map((slot) => ({
          dayOfWeek: slot.day_of_week,
          startTime: slot.start_time,
          endTime: slot.end_time,
        })),
        bookedSlots: allBlockedSlots,
        overrides: (overrides ?? []).map((override) => ({
          date: override.date,
          isAvailable: override.is_available,
          startTime: override.start_time ?? undefined,
          endTime: override.end_time ?? undefined,
        })),
        durationMinutes,
        timezone: primaryScheduleTimezone,
      });

      if (slots.length > 0) {
        availableDates.push(date);
      }
    }

    return NextResponse.json({ availableDates });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch month availability" },
      { status: 500 }
    );
  }
}
