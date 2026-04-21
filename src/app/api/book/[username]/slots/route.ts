import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAvailableSlots,
  type AvailabilityTemplateConfig,
  type BookedSlot,
} from "@/lib/availability";

export const dynamic = "force-dynamic";

/**
 * Public slot lookup for the admin calendar booking flow.
 *
 * GET /api/book/<username>/slots?date=YYYY-MM-DD&duration=<minutes>
 *
 * Returns the admin's bookable time slots on the given date. Reads
 * availability_templates owned by the admin (created_by = admin.user_id,
 * diviner_id + owner_id both NULL) and subtracts existing admin_bookings.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (!username || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
    return NextResponse.json(
      { error: "Missing or invalid params. Require username and date=YYYY-MM-DD." },
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

  const { data: templateRows, error: templatesErr } = await admin
    .from("availability_templates")
    .select(
      "id, title, start_date, end_date, weekdays, start_time, end_time, timezone, duration_minutes, description, is_active, service_id",
    )
    .eq("created_by", adminRow.user_id)
    .eq("is_active", true);

  if (templatesErr) {
    console.error("[book/slots] templates query error:", templatesErr);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }

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

  // Default duration: first active template's duration, or fall back to 60.
  const parsedDuration =
    durationParam != null ? Number.parseInt(durationParam, 10) : NaN;
  const durationMinutes =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : templates[0]?.durationMinutes ?? 60;

  // Widen the "booked" query by 1 day on each side to cover timezone edges.
  const rangeStart = new Date(`${date}T00:00:00Z`);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
  const rangeEnd = new Date(`${date}T00:00:00Z`);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 2);

  const { data: bookedRows } = await admin
    .from("admin_bookings")
    .select("scheduled_at, duration_minutes")
    .eq("admin_user_id", adminRow.user_id)
    .eq("status", "confirmed")
    .gte("scheduled_at", rangeStart.toISOString())
    .lt("scheduled_at", rangeEnd.toISOString());

  const bookedSlots: BookedSlot[] = (bookedRows ?? []).map((row) => {
    const start = new Date(String(row.scheduled_at));
    const end = new Date(
      start.getTime() + (Number(row.duration_minutes) || durationMinutes) * 60_000,
    );
    return { start: start.toISOString(), end: end.toISOString() };
  });

  const timezone = templates[0]?.timezone ?? "America/New_York";

  const slots = getAvailableSlots({
    date,
    templates,
    allTemplates: true, // admin calendar has no service filtering
    weeklySlots: [],
    bookedSlots,
    overrides: [],
    durationMinutes,
    timezone,
  });

  return NextResponse.json({
    username,
    date,
    durationMinutes,
    timezone,
    slots,
  });
}
