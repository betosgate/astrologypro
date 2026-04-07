"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

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
};

type Stats = {
  total: number;
  eclipses: number;
  ingresses: number;
  lunations: number;
  stations: number;
  conjunctions: number;
};

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Calendar helpers ──────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sun=0 to Mon-based: Mon=0, Tue=1, ..., Sun=6
  return day === 0 ? 6 : day - 1;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function EventCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [events, setEvents] = useState<AstroEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, eclipses: 0, ingresses: 0, lunations: 0, stations: 0, conjunctions: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

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
      setStats(json.stats ?? { total: 0, eclipses: 0, ingresses: 0, lunations: 0, stations: 0, conjunctions: 0 });
    }
    setLoading(false);
  }, [monthStr, selectedTypes]);

  useEffect(() => {
    fetchEvents();
    setSelectedDay(null);
  }, [fetchEvents]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  // Group events by day-of-month
  const eventsByDay: Record<number, AstroEvent[]> = {};
  for (const ev of events) {
    const d = new Date(ev.event_datetime_utc);
    const day = d.getUTCDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Build calendar grid rows
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="size-6 text-amber-500" />
            Event Calendar
          </h1>
          <p className="text-muted-foreground">Astrological events for {monthName}.</p>
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
        <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
        {ALL_EVENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selectedTypes.length === 0 || selectedTypes.includes(t)
                ? EVENT_TYPE_COLORS[t] ?? "bg-gray-100 text-gray-700 border-gray-200"
                : "bg-muted text-muted-foreground border-muted opacity-40"
            }`}
          >
            <span className={`size-2 rounded-full ${EVENT_TYPE_DOT[t] ?? "bg-gray-400"}`} />
            {t.replace("_", " ")}
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

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={prevMonth}>
          <ChevronLeft className="size-4 mr-1" /> Prev
        </Button>
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <Button size="sm" variant="outline" onClick={nextMonth}>
          Next <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Calendar grid */}
          <div className="flex-1">
            <div className="grid grid-cols-7 border rounded-lg overflow-hidden">
              {/* Day headers */}
              {dayHeaders.map((dh) => (
                <div key={dh} className="bg-muted px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-b">
                  {dh}
                </div>
              ))}
              {/* Day cells */}
              {weeks.map((week, wi) =>
                week.map((day, di) => {
                  const dayEvents = day ? (eventsByDay[day] ?? []) : [];
                  const isSelected = day === selectedDay;
                  const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                  return (
                    <button
                      key={`${wi}-${di}`}
                      onClick={() => day && setSelectedDay(isSelected ? null : day)}
                      disabled={!day}
                      className={`min-h-[80px] border-b border-r p-1.5 text-left transition-colors ${
                        day ? "hover:bg-muted/50 cursor-pointer" : "bg-muted/20"
                      } ${isSelected ? "bg-amber-50 ring-2 ring-amber-400 ring-inset" : ""}`}
                    >
                      {day && (
                        <>
                          <span className={`text-sm font-medium ${isToday ? "bg-amber-500 text-white rounded-full size-6 inline-flex items-center justify-center" : ""}`}>
                            {day}
                          </span>
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dayEvents.slice(0, 4).map((ev) => (
                              <span
                                key={ev.id}
                                title={ev.title}
                                className={`size-2 rounded-full ${EVENT_TYPE_DOT[ev.event_type] ?? "bg-gray-400"}`}
                              />
                            ))}
                            {dayEvents.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 4}</span>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected day detail panel */}
          {selectedDay !== null && (
            <div className="w-80 shrink-0">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </h3>
                    <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No events on this day.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedEvents.map((ev) => (
                        <div key={ev.id} className="rounded-md border p-2.5 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs capitalize ${EVENT_TYPE_COLORS[ev.event_type] ?? ""}`}>
                              {ev.event_type.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatTime(ev.event_datetime_utc)}</span>
                          </div>
                          <p className="text-sm font-medium">{ev.title}</p>
                          {(ev.planet_primary || ev.sign) && (
                            <p className="text-xs text-muted-foreground">
                              {[ev.planet_primary, ev.planet_secondary].filter(Boolean).join(" / ")}
                              {ev.sign && ` in ${ev.sign}`}
                            </p>
                          )}
                          {ev.notes && <p className="text-xs text-muted-foreground line-clamp-2">{ev.notes}</p>}
                          {!ev.is_verified && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Unverified</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
