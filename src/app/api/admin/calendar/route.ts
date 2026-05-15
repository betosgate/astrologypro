import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_CATEGORIES, EVENT_AUDIENCES } from "@/lib/calendar-events/constants";
import {
  generateOccurrenceResult,
  parseAdminEventDateTime,
  RecurrencePayload,
  RecurrenceRule,
} from "@/lib/calendar-events/recurrence";

export const dynamic = "force-dynamic";
const MAX_RECURRENCE_OCCURRENCES = 120;

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const startFrom = sp.get("start_date_from");
  const startTo = sp.get("start_date_to");
  const category = sp.get("category");

  const admin = createAdminClient();
  let query = admin
    .from("calendar_events")
    .select("*")
    .order("start_at", { ascending: false });

  if (startFrom) query = query.gte("start_at", startFrom);
  if (startTo) query = query.lte("start_at", startTo + "T23:59:59");
  if (category) query = query.eq("category", category); // exact match since we use dropdown now

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, category, start_at, end_at, display_for, priority, is_active, timezone, recurrence } = body as {
    title: string;
    description?: string;
    category: string;
    start_at: string;
    end_at: string;
    display_for: string;
    priority?: number;
    is_active?: boolean;
    timezone?: string;
    recurrence?: RecurrencePayload;
  };
  const eventTimezone = timezone || recurrence?.timezone || "UTC";

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!category || !EVENT_CATEGORIES.some((c) => c.value === category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!start_at) return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  if (!end_at) return NextResponse.json({ error: "End date is required" }, { status: 400 });

  const startDate = parseAdminEventDateTime(start_at, eventTimezone);
  const endDate = parseAdminEventDateTime(end_at, eventTimezone);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid start or end date" }, { status: 400 });
  }
  if (endDate <= startDate) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });

  if (!display_for || !EVENT_AUDIENCES.some((a) => a.value === display_for)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }
  if (!isSupportedTimezone(eventTimezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
  const normalizedPriority = Number(priority ?? 0);
  if (!Number.isFinite(normalizedPriority) || normalizedPriority < 0) {
    return NextResponse.json({ error: "Priority must be zero or greater" }, { status: 400 });
  }

  if (recurrence?.enabled) {
    if (!recurrence.days || recurrence.days.length === 0) {
      return NextResponse.json({ error: "Recurrence enabled but no days selected" }, { status: 400 });
    }
    if (!recurrence.days.every((day) => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].includes(day))) {
      return NextResponse.json({ error: "Invalid recurrence day selected" }, { status: 400 });
    }
    if (!recurrence.range_end) {
      return NextResponse.json({ error: "Recurrence enabled but no range end selected" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recurrence.range_end)) {
      return NextResponse.json({ error: "Invalid recurrence range end" }, { status: 400 });
    }
    const rangeEndDate = parseAdminEventDateTime(`${recurrence.range_end}T23:59`, eventTimezone);
    if (isNaN(rangeEndDate.getTime()) || rangeEndDate < startDate) {
      return NextResponse.json({ error: "Recurrence range end is before start date" }, { status: 400 });
    }
  }

  const recurrencePayload = recurrence?.enabled
    ? { ...recurrence, timezone: eventTimezone }
    : { enabled: false };
  const occurrenceResult = generateOccurrenceResult(startDate, endDate, recurrencePayload, MAX_RECURRENCE_OCCURRENCES);
  const occurrences = occurrenceResult.occurrences;
  if (occurrenceResult.exceededLimit) {
    return NextResponse.json(
      { error: "Recurring event creates more than 120 dates. Shorten the repeat range." },
      { status: 400 }
    );
  }
  if (occurrences.length === 0) {
    return NextResponse.json({ error: "No occurrences generated for this recurrence rule" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (!recurrence?.enabled) {
    // Single event
    const { data, error } = await admin
      .from("calendar_events")
      .insert({
        title,
        description,
        category,
        start_at: occurrences[0].start_at.toISOString(),
        end_at: occurrences[0].end_at.toISOString(),
        display_for,
        priority: normalizedPriority,
        is_active: is_active ?? true,
        event_timezone: eventTimezone,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } else {
    // Phase 1: generate recurrence occurrences synchronously on admin save so the
    // demo can show real community calendar rows without running a paid cron/Lambda.
    // Before launch, move rolling recurrence generation/cleanup/reminders into the
    // calendar event cron worker and keep this path idempotent.
    const seriesId = crypto.randomUUID();
    const parentId = crypto.randomUUID();
    const recurrenceRule: RecurrenceRule = {
      type: "weekly",
      days: recurrence.days!,
      range_end: recurrence.range_end!,
      timezone: eventTimezone,
      automation: "manual_on_save",
      cron_enabled: false,
    };

    const rowsToInsert = occurrences.map((occ, idx) => ({
      id: idx === 0 ? parentId : crypto.randomUUID(),
      title,
      description,
      category,
      start_at: occ.start_at.toISOString(),
      end_at: occ.end_at.toISOString(),
      display_for,
      priority: normalizedPriority,
      is_active: is_active ?? true,
      event_timezone: eventTimezone,
      recurrence_series_id: seriesId,
      recurrence_parent_id: idx === 0 ? null : parentId,
      recurrence_rule: idx === 0 ? recurrenceRule : null,
      recurrence_position: idx + 1,
      recurrence_generated_at: new Date().toISOString(),
    }));

    const { data, error } = await admin
      .from("calendar_events")
      .insert(rowsToInsert)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.find((row) => row.id === parentId) ?? data?.[0] ?? null, { status: 201 });
  }
}
