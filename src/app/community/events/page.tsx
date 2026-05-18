"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Landmark,
  MoonStar,
  MoveRight,
  NotebookTabs,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";
import { EventRsvpButton } from "@/components/community/event-rsvp-button";
import { cn } from "@/lib/utils";

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

interface RsvpInfo {
  my_rsvp: "going" | "maybe" | "not_going" | null;
  going_count: number;
  maybe_count: number;
}

type FilterKey =
  | "all"
  | "ritual"
  | "sunday_service"
  | "live_class"
  | "meditation"
  | "my_rsvps";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  ritual: "border-violet-400/30 bg-violet-500/15 text-violet-200",
  sunday_service: "border-teal-400/30 bg-teal-500/15 text-teal-200",
  live_class: "border-blue-400/30 bg-blue-500/15 text-blue-200",
  meditation: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  other: "border-slate-400/20 bg-slate-500/10 text-slate-200",
};

const CATEGORY_DOT: Record<string, string> = {
  ritual: "bg-purple-500",
  sunday_service: "bg-teal-500",
  live_class: "bg-blue-500",
  meditation: "bg-rose-500",
  other: "bg-slate-400",
};

const CATEGORY_ICON_COLORS: Record<string, string> = {
  ritual: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  sunday_service: "border-teal-400/30 bg-teal-500/10 text-teal-200",
  live_class: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  meditation: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  other: "border-slate-400/20 bg-slate-500/10 text-slate-200",
};

const CATEGORY_CARD_COLORS: Record<string, string> = {
  ritual: "border-violet-400/20 bg-violet-500/[0.07] shadow-[0_0_32px_rgba(139,92,246,0.08)]",
  sunday_service: "border-teal-400/20 bg-teal-500/[0.07] shadow-[0_0_32px_rgba(20,184,166,0.08)]",
  live_class: "border-blue-400/20 bg-blue-500/[0.07] shadow-[0_0_32px_rgba(59,130,246,0.08)]",
  meditation: "border-rose-400/20 bg-rose-500/[0.07] shadow-[0_0_32px_rgba(244,63,94,0.08)]",
  other: "border-white/10 bg-background/45",
};

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "ritual", label: "Ritual" },
  { key: "sunday_service", label: "Sunday Service" },
  { key: "live_class", label: "Live Class" },
  { key: "meditation", label: "Meditation" },
  { key: "my_rsvps", label: "My RSVPs" },
];

const DISPLAY_FOR_LABELS: Record<string, string> = {
  public: "Public",
  members: "Members",
  students: "Students",
  members_and_guests: "Members & Guests",
};

const CATEGORY_LABELS: Record<string, string> = {
  ritual: "Ritual",
  sunday_service: "Sunday Service",
  live_class: "Live Class",
  meditation: "Meditation",
  other: "Other",
};

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  ritual: "Ritual",
  sunday_service: "Service",
  live_class: "Class",
  meditation: "Meditation",
  other: "Other",
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

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function normalizeCategory(cat: string | null): string {
  const value = cat?.trim().toLowerCase();
  if (!value) return "other";
  // Maintain backward compatibility for old event string labels
  if (value === "ritual" || value === "ceremony") return "ritual";
  if (value.includes("sunday")) return "sunday_service";
  if (
    value === "live_class" ||
    value.includes("live class") ||
    value === "class" ||
    value === "webinar" ||
    value === "workshop"
  ) return "live_class";
  if (value === "meditation") return "meditation";
  if (value === "orientation") return "other";
  return CATEGORY_COLORS[value] ? value : "other";
}

function categoryLabel(cat: string | null): string {
  return CATEGORY_LABELS[normalizeCategory(cat)] ?? "Other";
}

function shortCategoryLabel(cat: string | null): string {
  return CATEGORY_SHORT_LABELS[normalizeCategory(cat)] ?? "Other";
}

function categoryColor(cat: string | null): string {
  return CATEGORY_COLORS[normalizeCategory(cat)];
}

function categoryDot(cat: string | null): string {
  return CATEGORY_DOT[normalizeCategory(cat)];
}

function categoryIconClasses(cat: string | null): string {
  return CATEGORY_ICON_COLORS[normalizeCategory(cat)];
}

function categoryCardClasses(cat: string | null): string {
  return CATEGORY_CARD_COLORS[normalizeCategory(cat)];
}

function EventCategoryIcon({ category, className }: { category: string | null; className?: string }) {
  const normalized = normalizeCategory(category);

  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full border shadow-inner",
        categoryIconClasses(category),
        className
      )}
    >
      {normalized === "ritual" ? (
        <MoonStar className="size-5" />
      ) : normalized === "sunday_service" ? (
        <Landmark className="size-5" />
      ) : normalized === "live_class" ? (
        <NotebookTabs className="size-5" />
      ) : (
        <Sparkles className="size-5" />
      )}
    </span>
  );
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

function isAttending(rsvp: RsvpInfo | undefined): boolean {
  return rsvp?.my_rsvp === "going" || rsvp?.my_rsvp === "maybe";
}

function buildIcsHref(event: CalendarEvent): string {
  const formatIcsDate = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escapeText = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
  const start = formatIcsDate(event.start_at);
  const end = formatIcsDate(event.end_at ?? event.start_at);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AstrologyPro//Community Events//EN",
    "BEGIN:VEVENT",
    `UID:community-event-${event.id}@astrologypro.com`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

function eventMatchesSearch(event: CalendarEvent, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [event.title, event.description, event.category, event.display_for]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

function audienceLabel(displayFor: string | null): string {
  if (!displayFor) return "Members";
  if (DISPLAY_FOR_LABELS[displayFor]) return DISPLAY_FOR_LABELS[displayFor];
  return displayFor
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommunityEventsPage() {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-based
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [rsvpMap, setRsvpMap] = useState<Record<string, RsvpInfo>>({});
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const fetchEvents = useCallback(async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/events?month=${month}&year=${year}`);
      if (res.ok) {
        const json = await res.json();
        const loadedEvents: CalendarEvent[] = json.events ?? [];
        setEvents(loadedEvents);

        // Fetch RSVPs for all loaded events in parallel
        if (loadedEvents.length > 0) {
          const rsvpResults = await Promise.allSettled(
            loadedEvents.map((e) =>
              fetch(`/api/community/events/${e.id}/rsvp`).then((r) => (r.ok ? r.json() : null))
            )
          );
          const newRsvpMap: Record<string, RsvpInfo> = {};
          rsvpResults.forEach((result, idx) => {
            if (result.status === "fulfilled" && result.value) {
              newRsvpMap[loadedEvents[idx].id] = result.value as RsvpInfo;
            }
          });
          setRsvpMap(newRsvpMap);
        } else {
          setRsvpMap({});
        }
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

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!eventMatchesSearch(event, search)) return false;
      if (activeFilter === "all") return true;
      if (activeFilter === "my_rsvps") return isAttending(rsvpMap[event.id]);
      return normalizeCategory(event.category) === activeFilter;
    });
  }, [activeFilter, events, rsvpMap, search]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => new Date(event.start_at) >= now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [filteredEvents, now]);

  const myRegisteredEvents = useMemo(() => {
    return events
      .filter((event) => isAttending(rsvpMap[event.id]) && new Date(event.start_at) >= now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 2);
  }, [events, now, rsvpMap]);

  function eventsOnDay(day: Date, source: CalendarEvent[] = filteredEvents): CalendarEvent[] {
    return source
      .filter((event) => isSameDay(new Date(event.start_at), day))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];
  const agendaEvents = selectedDay ? selectedDayEvents : upcomingEvents.slice(0, 6);
  const visibleEventCount = filteredEvents.length;

  function handleRsvpStatusChange(
    eventId: string,
    status: RsvpInfo["my_rsvp"],
    counts: { going: number; maybe: number }
  ) {
    setRsvpMap((current) => ({
      ...current,
      [eventId]: {
        my_rsvp: status,
        going_count: counts.going,
        maybe_count: counts.maybe,
      },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events Calendar</h1>
          <p className="text-muted-foreground">Browse and plan for upcoming community events.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card/70 px-3 py-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>{visibleEventCount} event{visibleEventCount === 1 ? "" : "s"} in this view</span>
        </div>
      </div>

      <Card className="border-white/10 bg-card/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  size="sm"
                  variant={activeFilter === filter.key ? "default" : "outline"}
                  className={cn(
                    "h-8 rounded-md px-3 text-xs",
                    activeFilter !== filter.key && "bg-background/40"
                  )}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.key === "my_rsvps" ? <CheckCircle2 className="mr-1.5 size-3.5" /> : null}
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="relative w-full xl:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events"
                className="h-9 pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-card/60 px-3 py-3">
            <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month" className="size-9">
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </h2>
              <p className="text-xs text-muted-foreground">Select a date to focus the agenda</p>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month" className="size-9">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card/50">
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

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
                    className={cn(
                      "min-h-[112px] border-b border-r p-2 text-left transition-colors last:border-r-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isCurrentMonth ? "bg-background/45 hover:bg-muted/40" : "bg-muted/15 text-muted-foreground",
                      isSelected && "bg-primary/10 ring-2 ring-inset ring-primary",
                    )}
                    aria-label={`${day.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 ? (
                        <span className="text-[10px] font-medium text-primary">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5 flex flex-col items-start gap-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className={cn(
                            "inline-flex max-w-full items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                            categoryColor(event.category)
                          )}
                          title={event.title}
                        >
                          <span className={cn("size-1.5 shrink-0 rounded-full", categoryDot(event.category))} />
                          <span className="truncate">{shortCategoryLabel(event.category)}</span>
                        </span>
                      ))}
                      {dayEvents.length > 2 ? (
                        <span className="text-[10px] font-medium leading-none text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 rounded-lg border bg-card/50 px-3 py-2 text-xs text-muted-foreground">
            {Object.entries(CATEGORY_DOT).filter(([cat]) => cat !== "other").map(([cat, dot]) => (
              <span key={cat} className="flex items-center gap-1">
                <span className={`inline-block size-2 rounded-full ${dot}`} />
                {categoryLabel(cat)}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-slate-400" />
              Other
            </span>
          </div>

          <Card className="border-white/10 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-primary" />
                My Registered Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myRegisteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  RSVP to an event and it will appear here for quick reference.
                </p>
              ) : (
                myRegisteredEvents.map((event) => (
                  <button
                    key={event.id}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40",
                      categoryCardClasses(event.category)
                    )}
                    onClick={() => {
                      const date = new Date(event.start_at);
                      setSelectedDay(date);
                      setViewYear(date.getFullYear());
                      setViewMonth(date.getMonth() + 1);
                    }}
                  >
                    <EventCategoryIcon category={event.category} className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{event.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="size-3" />
                        {formatEventTime(event.start_at)}
                      </span>
                    </span>
                    <Badge variant="outline" className="hidden shrink-0 border-emerald-400/25 bg-emerald-500/10 text-xs capitalize text-emerald-300 sm:inline-flex">
                      {rsvpMap[event.id]?.my_rsvp?.replace("_", " ")}
                    </Badge>
                    <MoveRight className="size-4 shrink-0 text-primary/70" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-white/10 bg-card/80">
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {selectedDay ? "Selected Day" : "Upcoming Rituals & Events"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDay
                    ? selectedDay.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Next events from your current view"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                  <CalendarDays className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Loading events…</p>
                </div>
              ) : agendaEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                  <CalendarDays className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">
                    {selectedDay ? "No events on this day" : "No upcoming events"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try another date, clear search, or switch filters.
                  </p>
                </div>
              ) : (
                agendaEvents.map((event) => {
                  const rsvp = rsvpMap[event.id];
                  const categoryName = categoryLabel(event.category);
                  return (
                    <Card
                      key={event.id}
                      className={cn("overflow-hidden", categoryCardClasses(event.category))}
                    >
                      <CardHeader className="space-y-3 p-4 pb-2">
                        <div className="flex items-start gap-3">
                          <EventCategoryIcon category={event.category} className="size-14" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              {event.category ? (
                                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", categoryColor(event.category))}>
                                  {categoryName}
                                </Badge>
                              ) : null}
                              <Bookmark className="size-4 shrink-0 text-muted-foreground/70" />
                            </div>
                            <CardTitle className="mt-2 text-base leading-snug">{event.title}</CardTitle>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="size-3" />
                                {selectedDay ? formatTimeOnly(event.start_at) : formatShortDate(event.start_at)}
                                {event.end_at ? ` - ${formatTimeOnly(event.end_at)}` : ""}
                              </span>
                              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-[10px] text-primary">
                                <ShieldCheck className="mr-1 size-3" />
                                {audienceLabel(event.display_for)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-4 pt-1">
                        {event.description ? (
                          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                            {event.description}
                          </p>
                        ) : null}
                        <EventRsvpButton
                          key={`${event.id}-${rsvp?.my_rsvp ?? "none"}-${rsvp?.going_count ?? 0}-${rsvp?.maybe_count ?? 0}`}
                          eventId={event.id}
                          initialStatus={rsvp?.my_rsvp ?? null}
                          initialCounts={{ going: rsvp?.going_count ?? 0, maybe: rsvp?.maybe_count ?? 0 }}
                          onStatusChange={(status, counts) => handleRsvpStatusChange(event.id, status, counts)}
                        />
                        <Button asChild size="sm" variant="outline" className="h-8 w-full border-primary/40 text-xs text-primary hover:bg-primary/10 hover:text-primary">
                          <a href={buildIcsHref(event)} download={`event-${event.id}.ics`}>
                            <CalendarPlus className="mr-1.5 size-3.5" />
                            Add to Calendar
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
