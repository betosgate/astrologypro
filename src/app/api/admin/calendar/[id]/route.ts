import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_CATEGORIES, EVENT_AUDIENCES } from "@/lib/calendar-events/constants";
import { parseAdminEventDateTime } from "@/lib/calendar-events/recurrence";

export const dynamic = "force-dynamic";

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, category, start_at, end_at, display_for, priority, is_active, timezone } = body;
  const eventTimezone = timezone || "UTC";

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

  // Phase 1: Only support editing single occurrences.
  // If the user submits changes to a recurring event, it only modifies this specific row.

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("calendar_events")
    .update({
      title,
      description,
      category,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      display_for,
      priority: normalizedPriority,
      is_active: is_active ?? true,
      event_timezone: eventTimezone,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const seriesAction = url.searchParams.get("seriesAction"); // 'single' | 'future'

  const admin = createAdminClient();

  if (seriesAction === "future") {
    // Phase 1 implementation for delete future series
    const { data: currentEvent, error: fetchError } = await admin
      .from("calendar_events")
      .select("start_at, recurrence_series_id")
      .eq("id", id)
      .single();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });
    if (!currentEvent.recurrence_series_id) {
      return NextResponse.json({ error: "Event is not part of a series" }, { status: 400 });
    }

    const { data: futureEvents, error: futureError } = await admin
      .from("calendar_events")
      .select("id")
      .eq("recurrence_series_id", currentEvent.recurrence_series_id)
      .gte("start_at", currentEvent.start_at);

    if (futureError) return NextResponse.json({ error: futureError.message }, { status: 500 });

    const futureEventIds = (futureEvents ?? []).map((event) => event.id);
    if (futureEventIds.length > 0) {
      const { data: rsvps, error: rsvpError } = await admin
        .from("event_rsvps")
        .select("id")
        .in("event_id", futureEventIds)
        .limit(1);

      if (rsvpError) return NextResponse.json({ error: rsvpError.message }, { status: 500 });
      if ((rsvps ?? []).length > 0) {
        return NextResponse.json(
          { error: "Cannot delete future occurrences because one or more already have RSVPs. Cancel those events instead." },
          { status: 409 }
        );
      }
    }

    // Delete this occurrence and all future occurrences only when no RSVP records exist.
    const { error: deleteError } = await admin
      .from("calendar_events")
      .delete()
      .eq("recurrence_series_id", currentEvent.recurrence_series_id)
      .gte("start_at", currentEvent.start_at);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Default: Delete single row
  const { error } = await admin.from("calendar_events").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
