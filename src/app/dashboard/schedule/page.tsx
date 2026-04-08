import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Schedule - Dashboard",
};

// ---------------------------------------------------------------------------
// ISO week helpers
// ---------------------------------------------------------------------------

/** Parse "YYYY-Www" → { year, week } */
function parseISOWeek(weekStr: string): { year: number; week: number } | null {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

/** Returns the Monday of the given ISO week */
function isoWeekToMonday(year: number, week: number): Date {
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Mon=1 … Sun=7
  const weekOneMonday = new Date(jan4);
  weekOneMonday.setDate(jan4.getDate() - jan4Day + 1);
  const monday = new Date(weekOneMonday);
  monday.setDate(weekOneMonday.getDate() + (week - 1) * 7);
  return monday;
}

/** Returns "YYYY-Www" for a given Date */
function toISOWeekStr(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function addWeeks(weekStr: string, delta: number): string {
  const parsed = parseISOWeek(weekStr);
  if (!parsed) return weekStr;
  const monday = isoWeekToMonday(parsed.year, parsed.week);
  monday.setDate(monday.getDate() + delta * 7);
  return toISOWeekStr(monday);
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Status colours (mirrors bookings page)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  no_show: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

// ---------------------------------------------------------------------------
// Booking type
// ---------------------------------------------------------------------------

interface BookingRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  base_price: number | null;
  total_amount: number | null;
  services: { id: string; name: string; category: string } | null;
  clients: { id: string; full_name: string | null; email: string | null } | null;
}

const ALL_STATUSES = ["pending", "confirmed", "in_progress", "completed", "canceled", "no_show"];
const ACTIVE_STATUSES = ["pending", "confirmed", "in_progress"];

// ---------------------------------------------------------------------------
// Schedule grid sub-component
// ---------------------------------------------------------------------------

const HOUR_HEIGHT_PX = 56; // px per hour row
const START_HOUR = 6;      // grid starts at 06:00
const END_HOUR = 22;       // grid ends at 22:00
const TOTAL_HOURS = END_HOUR - START_HOUR;

function timeLabel(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function ScheduleGrid({
  weekDays,
  bookings,
}: {
  weekDays: Date[];
  bookings: BookingRow[];
}) {
  const dayStrings = weekDays.map(formatDate);

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-[640px]"
        style={{ fontSize: "13px" }}
      >
        {/* Day headers */}
        <div
          className="grid border-b bg-muted/40 sticky top-0 z-10"
          style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}
        >
          <div className="border-r py-2" />
          {weekDays.map((day, i) => {
            const today = formatDate(new Date()) === dayStrings[i];
            return (
              <div
                key={dayStrings[i]}
                className={`border-r py-2 text-center ${today ? "bg-primary/10" : ""}`}
              >
                <p className={`text-xs uppercase tracking-wide ${today ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className={`text-base font-semibold ${today ? "text-primary" : ""}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        <div
          className="relative"
          style={{ height: TOTAL_HOURS * HOUR_HEIGHT_PX }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}
          >
            {/* Time labels column */}
            <div className="relative border-r">
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute right-1 text-[10px] text-muted-foreground"
                  style={{ top: i * HOUR_HEIGHT_PX - 7 }}
                >
                  {timeLabel(START_HOUR + i)}
                </div>
              ))}
            </div>

            {/* Day columns with hour gridlines */}
            {weekDays.map((_, colIdx) => (
              <div key={colIdx} className="relative border-r">
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-border/40"
                    style={{ top: i * HOUR_HEIGHT_PX }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Booking blocks — positioned absolutely per column */}
          {bookings.map((booking) => {
            const dt = new Date(booking.scheduled_at);
            const dateStr = formatDate(dt);
            const colIdx = dayStrings.indexOf(dateStr);
            if (colIdx === -1) return null;

            const bookingHour = dt.getHours() + dt.getMinutes() / 60;
            const topOffset = (bookingHour - START_HOUR) * HOUR_HEIGHT_PX;
            const blockHeight = (booking.duration_minutes / 60) * HOUR_HEIGHT_PX;

            // Skip if outside visible grid
            if (bookingHour < START_HOUR || bookingHour >= END_HOUR) return null;

            // Calculate left/width from column index
            // We have 7 columns from x=52px onward; each column = (100% - 52px) / 7
            const colFraction = 1 / 7;
            const leftPercent = `calc(52px + ${colIdx} * (100% - 52px) / 7)`;
            const widthPercent = `calc((100% - 52px) / 7 - 4px)`;

            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings?highlight=${booking.id}`}
                className="absolute overflow-hidden rounded border transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  top: Math.max(0, topOffset) + 2,
                  height: Math.max(blockHeight - 4, 22),
                  left: leftPercent,
                  width: widthPercent,
                  backgroundColor: blockBg(booking.status),
                  borderColor: blockBorder(booking.status),
                }}
                title={`${booking.services?.name ?? "Session"} — ${booking.clients?.full_name ?? "Client"} (${booking.status})`}
              >
                <div className="flex flex-col px-1.5 py-1 h-full overflow-hidden">
                  <p className="truncate text-[11px] font-semibold leading-tight" style={{ color: blockText(booking.status) }}>
                    {booking.clients?.full_name ?? "Client"}
                  </p>
                  <p className="truncate text-[10px] leading-tight opacity-80" style={{ color: blockText(booking.status) }}>
                    {booking.services?.name ?? "Session"}
                  </p>
                  {blockHeight >= 40 && (
                    <p className="text-[10px] leading-tight opacity-70 mt-auto" style={{ color: blockText(booking.status) }}>
                      {booking.duration_minutes} min
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function blockBg(status: string): string {
  switch (status) {
    case "confirmed": return "rgba(59, 130, 246, 0.15)";
    case "pending": return "rgba(234, 179, 8, 0.15)";
    case "in_progress": return "rgba(168, 85, 247, 0.18)";
    case "completed": return "rgba(34, 197, 94, 0.12)";
    case "canceled": return "rgba(239, 68, 68, 0.10)";
    default: return "rgba(148, 163, 184, 0.12)";
  }
}
function blockBorder(status: string): string {
  switch (status) {
    case "confirmed": return "rgba(59, 130, 246, 0.4)";
    case "pending": return "rgba(234, 179, 8, 0.4)";
    case "in_progress": return "rgba(168, 85, 247, 0.4)";
    case "completed": return "rgba(34, 197, 94, 0.3)";
    case "canceled": return "rgba(239, 68, 68, 0.3)";
    default: return "rgba(148, 163, 184, 0.3)";
  }
}
function blockText(status: string): string {
  switch (status) {
    case "confirmed": return "rgb(147, 197, 253)";
    case "pending": return "rgb(253, 224, 71)";
    case "in_progress": return "rgb(216, 180, 254)";
    case "completed": return "rgb(134, 239, 172)";
    case "canceled": return "rgb(252, 165, 165)";
    default: return "rgb(203, 213, 225)";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; status?: string }>;
}) {
  const { week: rawWeek, status: rawStatus } = await searchParams;

  const today = new Date();
  const currentWeekStr = toISOWeekStr(today);
  const weekStr = rawWeek ?? currentWeekStr;
  const parsed = parseISOWeek(weekStr) ?? parseISOWeek(currentWeekStr)!;

  const monday = isoWeekToMonday(parsed.year, parsed.week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const prevWeek = addWeeks(weekStr, -1);
  const nextWeek = addWeeks(weekStr, 1);
  const isCurrentWeek = weekStr === currentWeekStr;

  // Active status filter from URL
  const statusFilter = rawStatus && rawStatus !== "all" ? rawStatus : null;
  const activeStatuses = statusFilter
    ? statusFilter.split(",").map((s) => s.trim())
    : ACTIVE_STATUSES;

  // --- Auth & diviner ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, google_calendar_connected, outlook_calendar_connected")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) redirect("/admin");

  const hasExternalCalendar =
    diviner.google_calendar_connected || diviner.outlook_calendar_connected;

  // --- Fetch bookings for the week ---
  let bookingsQuery = supabase
    .from("bookings")
    .select(
      `id, scheduled_at, duration_minutes, status, base_price, total_amount,
       services(id, name, category),
       clients(id, full_name, email)`
    )
    .eq("diviner_id", diviner.id)
    .gte("scheduled_at", monday.toISOString())
    .lte("scheduled_at", sunday.toISOString())
    .order("scheduled_at", { ascending: true });

  // Apply status filter — if showing "all" fetch every status
  if (rawStatus && rawStatus !== "all") {
    bookingsQuery = bookingsQuery.in("status", activeStatuses);
  } else if (!rawStatus) {
    // Default: show active sessions only (not completed/canceled)
    bookingsQuery = bookingsQuery.in("status", ACTIVE_STATUSES);
  }

  const { data: rawBookings } = await bookingsQuery;
  const bookings = (rawBookings ?? []) as unknown as BookingRow[];

  // Summary stats (week totals — always from all bookings regardless of filter)
  const { data: weekStats } = await supabase
    .from("bookings")
    .select("status, duration_minutes, total_amount, base_price")
    .eq("diviner_id", diviner.id)
    .gte("scheduled_at", monday.toISOString())
    .lte("scheduled_at", sunday.toISOString())
    .in("status", ALL_STATUSES);

  const stats = (weekStats ?? []).reduce(
    (acc, b) => {
      if (["confirmed", "pending", "in_progress", "completed"].includes(b.status)) {
        acc.sessions++;
        acc.minutes += b.duration_minutes ?? 0;
        acc.revenue += b.total_amount ?? b.base_price ?? 0;
      }
      return acc;
    },
    { sessions: 0, minutes: 0, revenue: 0 }
  );

  // Week label
  const weekLabel = `${weekDays[0].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekDays[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  // Status filter chip builder
  const filterOptions = [
    { label: "Active", value: null },
    { label: "All", value: "all" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
    { label: "Canceled", value: "canceled" },
  ];

  function filterHref(v: string | null) {
    const params = new URLSearchParams();
    params.set("week", weekStr);
    if (v) params.set("status", v);
    return `?${params.toString()}`;
  }

  const activeFilterValue = rawStatus ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground text-sm">
            Your session schedule managed within AstrologyPro.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/bookings">View All Bookings</Link>
        </Button>
      </div>

      {/* No-calendar info banner */}
      {!hasExternalCalendar && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-400">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Your schedule is managed entirely within AstrologyPro.
            Optionally{" "}
            <Link
              href="/dashboard/calendar-connections"
              className="underline underline-offset-2 hover:text-blue-300"
            >
              connect Google or Outlook
            </Link>{" "}
            to sync bookings with your external calendar.
          </span>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Sessions</p>
            <p className="text-2xl font-bold">{stats.sessions}</p>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Hours</p>
            <p className="text-2xl font-bold">
              {(stats.minutes / 60).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">booked</p>
          </CardContent>
        </Card>
      </div>

      {/* Week navigation + status filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Week nav */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon" className="size-8">
            <Link href={`?week=${prevWeek}${rawStatus ? `&status=${rawStatus}` : ""}`} aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <span className="text-sm font-semibold min-w-[180px] text-center">
            {weekLabel}
          </span>
          <Button asChild variant="outline" size="icon" className="size-8">
            <Link href={`?week=${nextWeek}${rawStatus ? `&status=${rawStatus}` : ""}`} aria-label="Next week">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
          {!isCurrentWeek && (
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href={`?week=${currentWeekStr}${rawStatus ? `&status=${rawStatus}` : ""}`}>
                Today
              </Link>
            </Button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map((opt) => {
            const isActive = activeFilterValue === opt.value;
            return (
              <Link
                key={opt.value ?? "active"}
                href={filterHref(opt.value)}
                className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Schedule grid */}
      <Card>
        <CardContent className="p-0">
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading schedule…</div>}>
            <ScheduleGrid weekDays={weekDays} bookings={bookings} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { status: "confirmed", label: "Confirmed" },
          { status: "pending", label: "Pending" },
          { status: "in_progress", label: "In Progress" },
          { status: "completed", label: "Completed" },
          { status: "canceled", label: "Canceled" },
        ].map(({ status, label }) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded"
              style={{ backgroundColor: blockBg(status), border: `1px solid ${blockBorder(status)}` }}
            />
            <span style={{ color: blockText(status) }}>{label}</span>
          </span>
        ))}
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No sessions this week</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bookings will appear here when clients schedule sessions with you.
          </p>
        </div>
      )}
    </div>
  );
}
