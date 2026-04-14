"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Link2,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AstroEvent = {
  id: string;
  title: string;
  event_type: string;
  planet_primary: string | null;
  planet_secondary: string | null;
  sign: string | null;
  event_datetime_utc: string;
  notes: string | null;
  is_verified: boolean;
  linked_entity_id: string | null;
};

type Stats = {
  total: number;
  eclipses: number;
  ingresses: number;
  lunations: number;
  stations: number;
  conjunctions: number;
};

type ViewMode = "month" | "week" | "day";

// ─── Event type badge colors ───────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Record<string, string> = {
  ingress: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-purple-100 text-purple-700 border-purple-200",
  eclipse: "bg-red-100 text-red-700 border-red-200",
  conjunction: "bg-green-100 text-green-700 border-green-200",
  station: "bg-orange-100 text-orange-700 border-orange-200",
  opposition: "bg-gray-100 text-gray-700 border-gray-200",
  retrograde: "bg-amber-100 text-amber-700 border-amber-200",
  direct: "bg-teal-100 text-teal-700 border-teal-200",
  great_conjunction: "bg-emerald-100 text-emerald-700 border-emerald-200",
  return: "bg-cyan-100 text-cyan-700 border-cyan-200",
  solar_arc: "bg-indigo-100 text-indigo-700 border-indigo-200",
  custom: "bg-slate-100 text-slate-700 border-slate-200",
};

const EVENT_TYPE_DOT: Record<string, string> = {
  ingress: "bg-blue-500",
  lunation: "bg-purple-500",
  eclipse: "bg-red-500",
  conjunction: "bg-green-500",
  station: "bg-orange-500",
  opposition: "bg-gray-500",
  retrograde: "bg-amber-500",
  direct: "bg-teal-500",
  great_conjunction: "bg-emerald-500",
  return: "bg-cyan-500",
  solar_arc: "bg-indigo-500",
  custom: "bg-slate-500",
};

const ALL_EVENT_TYPES = [
  "ingress", "lunation", "eclipse", "conjunction", "opposition", "station",
  "retrograde", "direct", "great_conjunction", "return", "solar_arc", "custom",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sun=0 to Mon-based: Mon=0, Tue=1, ..., Sun=6
  return day === 0 ? 6 : day - 1;
}

/** Returns the Monday of the week containing the given date. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns an array of 7 Date objects starting from Monday of the week. */
function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameUTCDay(eventIso: string, date: Date): boolean {
  const ev = new Date(eventIso);
  return (
    ev.getUTCFullYear() === date.getUTCFullYear() &&
    ev.getUTCMonth() === date.getUTCMonth() &&
    ev.getUTCDate() === date.getUTCDate()
  );
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EventPill({
  ev,
  onClick,
}: {
  ev: AstroEvent;
  onClick: (ev: AstroEvent) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(ev);
      }}
      title={ev.title}
      className={`w-full text-left rounded px-1.5 py-0.5 text-[11px] font-medium border truncate transition-opacity hover:opacity-80 ${
        EVENT_TYPE_COLORS[ev.event_type] ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      <span className="flex items-center gap-1">
        <span
          className={`size-1.5 rounded-full shrink-0 ${EVENT_TYPE_DOT[ev.event_type] ?? "bg-gray-400"}`}
        />
        {formatTime(ev.event_datetime_utc)} {ev.title}
      </span>
    </button>
  );
}

// ─── Event Detail Drawer ───────────────────────────────────────────────────────

function EventDetailDrawer({
  event,
  onClose,
}: {
  event: AstroEvent | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {event && (
          <>
            <SheetHeader className="pb-0">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`capitalize text-xs ${EVENT_TYPE_COLORS[event.event_type] ?? ""}`}
                >
                  {event.event_type.replace(/_/g, " ")}
                </Badge>
                {event.is_verified ? (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-700 border-green-200 bg-green-50 flex items-center gap-1"
                  >
                    <CheckCircle className="size-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-600 border-amber-200 bg-amber-50 flex items-center gap-1"
                  >
                    <AlertCircle className="size-3" />
                    Unverified
                  </Badge>
                )}
              </div>
              <SheetTitle className="mt-2 text-base leading-snug">
                {event.title}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {formatDateFull(event.event_datetime_utc)} &middot;{" "}
                {formatTime(event.event_datetime_utc)} UTC
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-5 mt-2">
              {/* Planets & Sign */}
              {(event.planet_primary || event.sign) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Planets / Sign
                  </p>
                  <p className="text-sm">
                    {[event.planet_primary, event.planet_secondary]
                      .filter(Boolean)
                      .join(" / ")}
                    {event.sign && ` in ${event.sign}`}
                  </p>
                </div>
              )}

              {/* Notes */}
              {event.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {event.notes}
                  </p>
                </div>
              )}

              {/* Linked entity */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Linked Entity
                </p>
                {event.linked_entity_id ? (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Link2 className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {event.linked_entity_id}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No entity linked
                  </p>
                )}
                <div className="pt-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/mundane/entities">
                      <Link2 className="size-3.5 mr-1.5" />
                      Browse Entity Registry
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Date details */}
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Datetime
                </p>
                <p className="text-sm">
                  {formatDate(event.event_datetime_utc)} at{" "}
                  {formatTime(event.event_datetime_utc)} UTC
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  events,
  onEventClick,
  onDayClick,
  selectedDay,
}: {
  year: number;
  month: number;
  events: AstroEvent[];
  onEventClick: (ev: AstroEvent) => void;
  onDayClick: (day: number) => void;
  selectedDay: number | null;
}) {
  const now = new Date();

  const eventsByDay: Record<number, AstroEvent[]> = {};
  for (const ev of events) {
    const d = new Date(ev.event_datetime_utc);
    const day = d.getUTCDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="grid grid-cols-7 border rounded-lg overflow-hidden">
      {/* Day headers */}
      {dayHeaders.map((dh) => (
        <div
          key={dh}
          className="bg-muted px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-b"
        >
          {dh}
        </div>
      ))}
      {/* Day cells */}
      {weeks.map((week, wi) =>
        week.map((day, di) => {
          const dayEvents = day ? (eventsByDay[day] ?? []) : [];
          const isSelected = day === selectedDay;
          const isTodayCell =
            day === now.getDate() &&
            month === now.getMonth() &&
            year === now.getFullYear();
          return (
            <div
              key={`${wi}-${di}`}
              onClick={() => day && onDayClick(day)}
              className={`min-h-[90px] border-b border-r p-1.5 transition-colors ${
                day
                  ? "hover:bg-muted/30 cursor-pointer"
                  : "bg-muted/20 cursor-default"
              } ${isSelected ? "bg-amber-50 ring-2 ring-amber-400 ring-inset" : ""}`}
            >
              {day && (
                <>
                  <span
                    className={`text-sm font-medium ${
                      isTodayCell
                        ? "bg-amber-500 text-white rounded-full size-6 inline-flex items-center justify-center"
                        : ""
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <EventPill key={ev.id} ev={ev} onClick={onEventClick} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  weekStart,
  events,
  onEventClick,
}: {
  weekStart: Date;
  events: AstroEvent[];
  onEventClick: (ev: AstroEvent) => void;
}) {
  const weekDays = getWeekDays(weekStart);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b bg-muted">
        {weekDays.map((date, i) => {
          const todayCell = isToday(date);
          return (
            <div
              key={i}
              className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0"
            >
              <span className="block">{dayNames[i]}</span>
              <span
                className={`mt-0.5 text-base font-bold block mx-auto w-7 h-7 leading-7 rounded-full ${
                  todayCell
                    ? "bg-amber-500 text-white"
                    : "text-foreground"
                }`}
              >
                {date.getDate()}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {date.toLocaleDateString("en-US", { month: "short" })}
              </span>
            </div>
          );
        })}
      </div>
      {/* Event rows */}
      <div className="grid grid-cols-7 min-h-[200px]">
        {weekDays.map((date, i) => {
          const dayEvents = events.filter((ev) =>
            isSameUTCDay(ev.event_datetime_utc, date)
          );
          const todayCell = isToday(date);
          return (
            <div
              key={i}
              className={`border-r last:border-r-0 p-1.5 min-h-[200px] space-y-0.5 ${
                todayCell ? "bg-amber-50/40" : ""
              }`}
            >
              {dayEvents.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center pt-4">
                  —
                </p>
              ) : (
                dayEvents.map((ev) => (
                  <EventPill key={ev.id} ev={ev} onClick={onEventClick} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ──────────────────────────────────────────────────────────────────

function DayView({
  date,
  events,
  onEventClick,
}: {
  date: Date;
  events: AstroEvent[];
  onEventClick: (ev: AstroEvent) => void;
}) {
  const dayEvents = events
    .filter((ev) => isSameUTCDay(ev.event_datetime_utc, date))
    .sort(
      (a, b) =>
        new Date(a.event_datetime_utc).getTime() -
        new Date(b.event_datetime_utc).getTime()
    );

  const todayCell = isToday(date);
  const label = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className={`px-4 py-3 border-b font-semibold text-sm flex items-center gap-2 ${
          todayCell ? "bg-amber-50" : "bg-muted"
        }`}
      >
        {todayCell && (
          <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs">
            Today
          </span>
        )}
        {label}
        <span className="text-muted-foreground font-normal ml-auto text-xs">
          {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {dayEvents.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No events on this day.
        </div>
      ) : (
        <div className="divide-y">
          {dayEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`capitalize text-xs ${EVENT_TYPE_COLORS[ev.event_type] ?? ""}`}
                >
                  {ev.event_type.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTime(ev.event_datetime_utc)} UTC
                </span>
                {!ev.is_verified && (
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-600 border-amber-200 bg-amber-50"
                  >
                    Unverified
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm font-medium group-hover:text-amber-700 transition-colors">
                {ev.title}
              </p>
              {(ev.planet_primary || ev.sign) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[ev.planet_primary, ev.planet_secondary]
                    .filter(Boolean)
                    .join(" / ")}
                  {ev.sign && ` in ${ev.sign}`}
                </p>
              )}
              {ev.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ev.notes}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function EventCalendarPage() {
  const now = new Date();

  // View state
  const [view, setView] = useState<ViewMode>("month");

  // Month view state
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  // Week view state — tracked as the Monday of the current week
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(now));

  // Day view state
  const [dayDate, setDayDate] = useState<Date>(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Data state
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    eclipses: 0,
    ingresses: 0,
    lunations: 0,
    stations: 0,
    conjunctions: 0,
  });
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AstroEvent | null>(null);

  // Compute month string used for the calendar API
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: monthStr });
    if (selectedTypes.length > 0) {
      params.set("types", selectedTypes.join(","));
    }
    const res = await fetch(`/api/admin/mundane/event-calendar?${params}`);
    if (res.ok) {
      const json = await res.json();
      setEvents(json.events ?? []);
      setStats(
        json.stats ?? {
          total: 0,
          eclipses: 0,
          ingresses: 0,
          lunations: 0,
          stations: 0,
          conjunctions: 0,
        }
      );
    }
    setLoading(false);
  }, [monthStr, selectedTypes]);

  useEffect(() => {
    fetchEvents();
    setSelectedDay(null);
  }, [fetchEvents]);

  // ── Month navigation ──
  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // ── Week navigation ──
  function prevWeek() {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() - 7);
      // Sync month view to the week's month
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      return d;
    });
  }
  function nextWeek() {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + 7);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      return d;
    });
  }
  function goToCurrentWeek() {
    const ws = getWeekStart(now);
    setWeekStart(ws);
    setYear(ws.getFullYear());
    setMonth(ws.getMonth());
  }

  // ── Day navigation ──
  function prevDay() {
    setDayDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 1);
      setYear(nd.getFullYear());
      setMonth(nd.getMonth());
      return nd;
    });
  }
  function nextDay() {
    setDayDate((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      setYear(nd.getFullYear());
      setMonth(nd.getMonth());
      return nd;
    });
  }
  function goToToday() {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    setDayDate(d);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function handleDayClick(day: number) {
    setSelectedDay((prev) => (prev === day ? null : day));
  }

  function handleEventClick(ev: AstroEvent) {
    setSelectedEvent(ev);
  }

  // ── Navigation label ──
  const monthName = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekEndDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const dayLabel = dayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const selectedDayEvents = selectedDay ? (events.filter((ev) => {
    const d = new Date(ev.event_datetime_utc);
    return d.getUTCDate() === selectedDay;
  }) ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="size-6 text-amber-500" />
            Event Calendar
          </h1>
          <p className="text-muted-foreground">
            Astrological events for {monthName}.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/mundane">Back to Hub</Link>
        </Button>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Events" value={stats.total} />
        <StatCard label="Eclipses" value={stats.eclipses} />
        <StatCard label="Ingresses" value={stats.ingresses} />
        <StatCard label="Lunations" value={stats.lunations} />
        <StatCard label="Stations" value={stats.stations} />
        <StatCard label="Conjunctions" value={stats.conjunctions} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Filter by type:
        </span>
        {ALL_EVENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selectedTypes.length === 0 || selectedTypes.includes(t)
                ? (EVENT_TYPE_COLORS[t] ??
                  "bg-gray-100 text-gray-700 border-gray-200")
                : "bg-muted text-muted-foreground border-muted opacity-40"
            }`}
          >
            <span
              className={`size-2 rounded-full ${EVENT_TYPE_DOT[t] ?? "bg-gray-400"}`}
            />
            {t.replace(/_/g, " ")}
          </button>
        ))}
        {selectedTypes.length > 0 && (
          <button
            onClick={() => setSelectedTypes([])}
            className="text-xs text-muted-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted p-1 w-fit">
        <button
          onClick={() => setView("month")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "month"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="size-3.5" />
          Month
        </button>
        <button
          onClick={() => setView("week")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "week"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarRange className="size-3.5" />
          Week
        </button>
        <button
          onClick={() => setView("day")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "day"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="size-3.5" />
          Day
        </button>
      </div>

      {/* Navigation bar — varies by view */}
      <div className="flex items-center justify-between">
        {view === "month" && (
          <>
            <Button size="sm" variant="outline" onClick={prevMonth}>
              <ChevronLeft className="size-4 mr-1" /> Prev
            </Button>
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <Button size="sm" variant="outline" onClick={nextMonth}>
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          </>
        )}

        {view === "week" && (
          <>
            <Button size="sm" variant="outline" onClick={prevWeek}>
              <ChevronLeft className="size-4 mr-1" /> Prev Week
            </Button>
            <div className="flex flex-col items-center gap-0.5">
              <h2 className="text-lg font-semibold">{weekLabel}</h2>
              <button
                onClick={goToCurrentWeek}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                This week
              </button>
            </div>
            <Button size="sm" variant="outline" onClick={nextWeek}>
              Next Week <ChevronRight className="size-4 ml-1" />
            </Button>
          </>
        )}

        {view === "day" && (
          <>
            <Button size="sm" variant="outline" onClick={prevDay}>
              <ChevronLeft className="size-4 mr-1" /> Prev Day
            </Button>
            <div className="flex flex-col items-center gap-0.5">
              <h2 className="text-lg font-semibold">{dayLabel}</h2>
              <button
                onClick={goToToday}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Today
              </button>
            </div>
            <Button size="sm" variant="outline" onClick={nextDay}>
              Next Day <ChevronRight className="size-4 ml-1" />
            </Button>
          </>
        )}
      </div>

      {/* Calendar body */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {view === "month" && (
            <div className="flex gap-6">
              {/* Monthly grid */}
              <div className="flex-1 min-w-0">
                <MonthView
                  year={year}
                  month={month}
                  events={events}
                  onEventClick={handleEventClick}
                  onDayClick={handleDayClick}
                  selectedDay={selectedDay}
                />
              </div>

              {/* Day detail panel (month view only) */}
              {selectedDay !== null && (
                <div className="w-80 shrink-0">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">
                          {new Date(year, month, selectedDay).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </h3>
                        <button
                          onClick={() => setSelectedDay(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      {selectedDayEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No events on this day.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedDayEvents.map((ev) => (
                            <button
                              key={ev.id}
                              onClick={() => handleEventClick(ev)}
                              className="w-full text-left rounded-md border p-2.5 space-y-1 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs capitalize ${EVENT_TYPE_COLORS[ev.event_type] ?? ""}`}
                                >
                                  {ev.event_type.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(ev.event_datetime_utc)}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{ev.title}</p>
                              {(ev.planet_primary || ev.sign) && (
                                <p className="text-xs text-muted-foreground">
                                  {[ev.planet_primary, ev.planet_secondary]
                                    .filter(Boolean)
                                    .join(" / ")}
                                  {ev.sign && ` in ${ev.sign}`}
                                </p>
                              )}
                              {ev.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {ev.notes}
                                </p>
                              )}
                              {!ev.is_verified && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-amber-600 border-amber-200 bg-amber-50"
                                >
                                  Unverified
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {view === "week" && (
            <WeekView
              weekStart={weekStart}
              events={events}
              onEventClick={handleEventClick}
            />
          )}

          {view === "day" && (
            <DayView
              date={dayDate}
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}

      {/* Event detail drawer — all views */}
      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
