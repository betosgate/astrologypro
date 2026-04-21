import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAvailableSlots,
  type AvailabilityTemplateConfig,
  type BookedSlot,
} from "@/lib/availability";

export const dynamic = "force-dynamic";

/**
 * Which dates in a month have at least one bookable slot for this admin.
 *
 * GET /api/book/<username>/month?month=YYYY-MM[&duration=N]
 * → { availableDates: string[] }  (each entry is YYYY-MM-DD)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get("month");
  const durationParam = searchParams.get("duration");

  if (!username || !/^\d{4}-\d{2}$/.test(monthParam ?? "")) {
    return NextResponse.json(
      { error: "Missing or invalid params. Require username and month=YYYY-MM." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .ilike("username", username)
    .maybeSingle();

  if (!adminRow?.user_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: templateRows } = await admin
    .from("availability_templates")
    .select(
      "id, title, start_date, end_date, weekdays, start_time, end_time, timezone, duration_minutes, description, is_active, service_id",
    )
    .eq("created_by", adminRow.user_id)
    .eq("is_active", true);

  const templates: AvailabilityTemplateConfig[] = (templateRows ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? "Available"),
    serviceId: row.service_id ? String(row.service_id) : null,
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    weekdays: Array.isArray(row.weekdays) ? (row.weekdays as number[]) : [],
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    timezone: String(row.timezone),
    durationMinutes: Number(row.duration_minutes) || 60,
    description: typeof row.description === "string" ? row.description : null,
    isActive: row.is_active !== false,
  }));

  if (templates.length === 0) {
    return NextResponse.json({ availableDates: [] });
  }

  const parsedDuration =
    durationParam != null ? Number.parseInt(durationParam, 10) : NaN;
  const durationMinutes =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : templates[0].durationMinutes ?? 60;
  const timezone = templates[0].timezone ?? "America/New_York";

  // Pull all bookings for the month in one shot, then group by local date.
  const [yearStr, monthStr] = (monthParam as string).split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 1));

  const { data: bookedRows } = await admin
    .from("admin_bookings")
    .select("scheduled_at, duration_minutes")
    .eq("admin_user_id", adminRow.user_id)
    .eq("status", "confirmed")
    .gte("scheduled_at", new Date(monthStart.getTime() - 86400_000).toISOString())
    .lt("scheduled_at", new Date(monthEnd.getTime() + 86400_000).toISOString());

  const allBooked: BookedSlot[] = (bookedRows ?? []).map((row) => {
    const start = new Date(String(row.scheduled_at));
    const end = new Date(
      start.getTime() + (Number(row.duration_minutes) || durationMinutes) * 60_000,
    );
    return { start: start.toISOString(), end: end.toISOString() };
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const available: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, monthIndex, day);
    if (dayDate < todayStart) continue;

    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const slots = getAvailableSlots({
      date: dateStr,
      templates,
      allTemplates: true,
      weeklySlots: [],
      bookedSlots: allBooked,
      overrides: [],
      durationMinutes,
      timezone,
    });

    if (slots.length > 0) {
      available.push(dateStr);
    }
  }

  return NextResponse.json({
    availableDates: available,
    durationMinutes,
    timezone,
  });
}
