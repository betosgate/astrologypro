"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  start_at: string;
  end_at: string | null;
  display_for: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  ritual: "bg-purple-500/15 text-purple-700 border-purple-200",
  ceremony: "bg-indigo-500/15 text-indigo-700 border-indigo-200",
  "live class": "bg-blue-500/15 text-blue-700 border-blue-200",
  meditation: "bg-teal-500/15 text-teal-700 border-teal-200",
};

const CATEGORY_DOT: Record<string, string> = {
  ritual: "bg-purple-500",
  ceremony: "bg-indigo-500",
  "live class": "bg-blue-500",
  meditation: "bg-teal-500",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatTimeOnly(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function categoryColor(cat: string | null): string {
  if (!cat) return "bg-gray-100 text-gray-600 border-gray-200";
  return CATEGORY_COLORS[cat.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
}

function categoryDot(cat: string | null): string {
  if (!cat) return "bg-gray-400";
  return CATEGORY_DOT[cat.toLowerCase()] ?? "bg-gray-400";
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function buildCalendarDays(year: number, month: number): Date[] {
  // month is 0-based here
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: Date[] = [];

  // Pad start with days from previous month
  const startDow = firstDay.getDay(); // 0 = Sun
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Pad end to fill last row (6 rows × 7 = 42 cells max)
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1));
  }

  return days;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommunityEventsPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-based
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchEvents = useCallback(async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/events?month=${month}&year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setEvents(json.events ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(viewMonth, viewYear);
  }, [viewMonth, viewYear, fetchEvents]);

  function prevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  const calendarDays = buildCalendarDays(viewYear, viewMonth - 1);
  const currentMonthStart = new Date(viewYear, viewMonth - 1, 1);

  // Events on a given calendar cell date
  function eventsOnDay(day: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(new Date(e.start_at), day));
  }

  // Panel events — if a day is selected show that day's events, else show all upcoming
  const panelEvents = selectedDay
    ? eventsOnDay(selectedDay)
    : events.filter((e) => new Date(e.start_at) >= now).slice(0, 10);

  // Upcoming next-5 sidebar
  const upcomingFive = events
    .filter((e) => new Date(e.start_at) >= now)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Events Calendar</h1>
        <p className="text-muted-foreground">Browse and plan for upcoming community events.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── Calendar + event list ── */}
        <div className="space-y-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="rounded-lg border overflow-hidden">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = day.getMonth() === currentMonthStart.getMonth();
                const isToday = isSameDay(day, now);
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                const dayEvents = eventsOnDay(day);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={[
                      "min-h-[72px] p-1.5 text-left border-b border-r last:border-r-0 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isCurrentMonth ? "bg-background hover:bg-muted/40" : "bg-muted/20",
                      isSelected ? "ring-2 ring-inset ring-primary" : "",
                    ].join(" ")}
                    aria-label={`${day.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                  >
                    <span
                      className={[
                        "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`inline-block size-2 rounded-full ${categoryDot(e.category)}`}
                          title={e.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category legend */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.entries(CATEGORY_DOT).map(([cat, dot]) => (
              <span key={cat} className="flex items-center gap-1 capitalize">
                <span className={`inline-block size-2 rounded-full ${dot}`} />
                {cat}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-gray-400" />
              Other
            </span>
          </div>

          {/* Event detail panel */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {selectedDay
                ? selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                : "Upcoming Events"}
            </h3>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading events…</p>
            ) : panelEvents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CalendarDays className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {selectedDay ? "No events on this day." : "No upcoming events this period."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {panelEvents.map((e) => (
                  <Card key={e.id}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm leading-snug">{e.title}</CardTitle>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatEventTime(e.start_at)}
                            {e.end_at && ` – ${formatTimeOnly(e.end_at)}`}
                          </p>
                        </div>
                        {e.category && (
                          <Badge variant="outline" className={`shrink-0 text-xs capitalize ${categoryColor(e.category)}`}>
                            {e.category}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    {e.description && (
                      <CardContent className="px-4 pb-4 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3">{e.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Upcoming sidebar ── */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold">Next 5 Events</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : upcomingFive.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <div className="space-y-2">
              {upcomingFive.map((e) => (
                <button
                  key={e.id}
                  className="w-full rounded-lg border bg-card p-3 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    const d = new Date(e.start_at);
                    // Navigate calendar to the event's month if needed
                    if (d.getFullYear() !== viewYear || d.getMonth() + 1 !== viewMonth) {
                      setViewYear(d.getFullYear());
                      setViewMonth(d.getMonth() + 1);
                    }
                    setSelectedDay(d);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 size-2 rounded-full ${categoryDot(e.category)}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-snug truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatEventTime(e.start_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
