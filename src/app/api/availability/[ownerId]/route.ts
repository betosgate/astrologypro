import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/availability";
import { getAvailableSlotsFromGoogle, getGoogleBusySchedule } from "@/lib/google-calendar";
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
  const allSlots = searchParams.get("allSlots") === "1";
  const debugBusy = searchParams.get("debugBusy") === "1";

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
      .select("timezone, user_id, google_calendar_token, outlook_calendar_token")
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
    const connectionFilters = [`owner_id.eq.${ownerId}`];
    if (diviner.user_id) {
      connectionFilters.push(`user_id.eq.${diviner.user_id}`);
    }

    const { data: connections } = await admin
      .from("calendar_connections")
      .select("provider")
      .or(connectionFilters.join(","));

    const isGoogleConnected =
      connections?.some(c => c.provider === "google") ||
      Boolean(diviner.google_calendar_token);
    const isOutlookConnected =
      connections?.some(c => c.provider === "microsoft") ||
      Boolean(diviner.outlook_calendar_token);

    // New date-ranged schedules created from the dashboard.
    const { data: templates } = await admin
      .from("availability_templates")
      .select("*")
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

    const requestedDayOfWeek = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    const relevantTemplates = (templates ?? []).filter((template) => {
      const record = template as Record<string, unknown>;
      if (record.is_active === false) return false;

      const templateServiceId =
        typeof record.service_id === "string" ? record.service_id : null;
      if (!allSlots) {
        if (serviceId) {
          // Only use templates explicitly linked to this service.
          // No fallback to generic templates.
          if (templateServiceId !== serviceId) return false;
        } else if (templateServiceId) {
          return false;
        }
      }

      const startDate = String(record.start_date ?? "");
      const endDate = String(record.end_date ?? "");
      if (date < startDate || date > endDate) return false;

      const weekdays = Array.isArray(record.weekdays)
        ? record.weekdays.map((value) => Number(value))
        : [];

      return weekdays.includes(requestedDayOfWeek);
    });

    const availabilityTimezones = Array.from(
      new Set(
        relevantTemplates
          .map((template) => String((template as Record<string, unknown>).timezone ?? ""))
          .filter(Boolean)
      )
    );

    const fallbackTemplateTimezone = (templates ?? [])
      .map((template) => String((template as Record<string, unknown>).timezone ?? ""))
      .find(Boolean);

    const primaryScheduleTimezone =
      availabilityTimezones[0] ?? fallbackTemplateTimezone ?? "UTC";
    const calendarQueryTimezones =
      availabilityTimezones.length > 0 ? availabilityTimezones : [primaryScheduleTimezone];

    // Query a widened UTC range so timezone-converted schedule windows
    // near midnight are still blocked correctly.
    const selectedDayUtc = new Date(`${date}T00:00:00.000Z`);
    const queryStart = new Date(selectedDayUtc.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const queryEnd = new Date(selectedDayUtc.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const { data: bookings } = await admin
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, status, services(name), clients(full_name)")
      .eq("owner_id", ownerId)
      .gte("scheduled_at", queryStart)
      .lte("scheduled_at", queryEnd)
      .in("status", ["pending", "confirmed", "in_progress"]);

    // Also treat active holds as booked (prevents race-condition double-booking)
    const { data: holds } = await admin
      .from("booking_holds")
      .select("id, scheduled_at, duration_minutes, expires_at, session_token")
      .eq("owner_id", ownerId)
      .gt("expires_at", new Date().toISOString())
      .gte("scheduled_at", queryStart)
      .lte("scheduled_at", queryEnd);

    // Fetch external calendar busy slots only when the diviner has connected
    // Each call is individually guarded and caught so a missing token never
    // blocks the internal availability calculation.
    let externalBusy: { start: string; end: string }[] = [];
    let googleBusyDebug: Awaited<ReturnType<typeof getGoogleBusySchedule>> = [];
    let outlookBusyDebug: Array<{ start: string; end: string; source: "microsoft"; title: string }> = [];
    try {
      const googleResults = isGoogleConnected
        ? await Promise.all(
            calendarQueryTimezones.map((timezone) =>
              debugBusy
                ? getGoogleBusySchedule(ownerId, date, timezone).catch(() => [])
                : getAvailableSlotsFromGoogle(ownerId, date, timezone).catch(
                    () => [] as { start: string; end: string }[]
                  )
            )
          )
        : [];

      const outlookResults = isOutlookConnected
        ? await Promise.all(
            calendarQueryTimezones.map((timezone) =>
              getMsFreeBusy(ownerId, date, timezone).catch(
                () => [] as { start: string; end: string }[]
              )
            )
          )
        : [];

      const googleBusy = googleResults.flat();
      const outlookBusy = outlookResults.flat();

      if (debugBusy) {
        googleBusyDebug = Array.from(
          new Map(
            (googleBusy as Awaited<ReturnType<typeof getGoogleBusySchedule>>).map((entry) => [
              `${entry.start}-${entry.end}-${entry.title}`,
              entry,
            ])
          ).values()
        );
        outlookBusyDebug = (outlookBusy as { start: string; end: string }[]).map((slot) => ({
          ...slot,
          source: "microsoft" as const,
          title: "Microsoft Calendar busy",
        }));
        externalBusy = [
          ...googleBusyDebug.map((slot) => ({ start: slot.start, end: slot.end })),
          ...(outlookBusy as { start: string; end: string }[]),
        ];
      } else {
        externalBusy = [...(googleBusy as { start: string; end: string }[]), ...(outlookBusy as { start: string; end: string }[])];
      }
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
      templates: (templates ?? []).map((template) => {
        const record = template as Record<string, unknown>;
        return {
          id: String(record.id ?? ""),
          title: String(record.title ?? "Available"),
          serviceId: typeof record.service_id === "string" ? record.service_id : null,
          startDate: String(record.start_date ?? ""),
          endDate: String(record.end_date ?? ""),
          weekdays: Array.isArray(record.weekdays) ? (record.weekdays as number[]) : [],
          startTime: String(record.start_time ?? ""),
          endTime: String(record.end_time ?? ""),
          timezone: String(record.timezone ?? primaryScheduleTimezone),
          durationMinutes:
            typeof record.duration_minutes === "number" ? record.duration_minutes : durationMinutes,
          description: typeof record.description === "string" ? record.description : null,
          isActive: record.is_active !== false,
        };
      }),
      serviceId,
      allTemplates: allSlots,
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
      timezone: primaryScheduleTimezone,
    });

    if (debugBusy) {
      const busySchedule = [
        ...((bookings ?? []).map((booking) => ({
          id: String(booking.id),
          title:
            booking.services && typeof booking.services === "object" && "name" in booking.services
              ? `${String((booking.services as { name?: string | null }).name ?? "Booking")}`
              : "Booking",
          start: booking.scheduled_at,
          end: new Date(
            new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60_000
          ).toISOString(),
          source: "booking" as const,
          details:
            booking.clients && typeof booking.clients === "object" && "full_name" in booking.clients
              ? `${String((booking.clients as { full_name?: string | null }).full_name ?? "Client")} • ${booking.status}`
              : booking.status,
        })) ?? []),
        ...((holds ?? []).map((hold) => ({
          id: String(hold.id),
          title: "Pending hold",
          start: hold.scheduled_at,
          end: new Date(
            new Date(hold.scheduled_at).getTime() + (hold.duration_minutes ?? 60) * 60_000
          ).toISOString(),
          source: "hold" as const,
          details: hold.expires_at ? `Reserved until ${hold.expires_at}` : hold.session_token ?? null,
        })) ?? []),
        ...googleBusyDebug.map((entry) => ({
          id: entry.id,
          title: entry.title,
          start: entry.start,
          end: entry.end,
          source: entry.source,
          details: entry.location || entry.description || entry.status || null,
        })),
        ...outlookBusyDebug.map((entry, index) => ({
          id: `${entry.source}-${index}-${entry.start}`,
          title: entry.title,
          start: entry.start,
          end: entry.end,
          source: entry.source,
          details: null,
        })),
      ].sort((a, b) => a.start.localeCompare(b.start));

      return NextResponse.json({
        slots,
        busySchedule,
        timezone: primaryScheduleTimezone,
      });
    }

    // Enrich slots with service price info when a service is linked
    const serviceIds = [...new Set(
      slots
        .map((s: { availabilityServiceId?: string | null }) => s.availabilityServiceId)
        .filter(Boolean) as string[]
    )];

    let servicePriceMap: Record<string, { name: string; price: number }> = {};
    if (serviceIds.length > 0) {
      const { data: services } = await admin
        .from("services")
        .select("id, name, base_price")
        .in("id", serviceIds);
      if (services) {
        for (const svc of services) {
          servicePriceMap[svc.id] = { name: svc.name, price: Number(svc.base_price ?? 0) };
        }
      }
    }

    const enrichedSlots = slots.map((slot) => {
      const svcId = (slot as unknown as Record<string, unknown>).availabilityServiceId as string | null;
      const svcInfo = svcId ? servicePriceMap[svcId] : null;
      return {
        ...slot,
        serviceName: svcInfo?.name ?? null,
        servicePrice: svcInfo?.price ?? null,
      };
    });

    return NextResponse.json(enrichedSlots);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
