"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

function decodeHtmlEntities(html: string): string {
  let decoded = html;
  const entityPattern = /&(?:lt|gt|amp|quot|#39|#x27|nbsp);/i;
  let i = 0;
  while (entityPattern.test(decoded) && i < 3) {
    decoded = decoded
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&#x27;/gi, "'")
      .replace(/&nbsp;/gi, " ");
    i++;
  }
  return decoded;
}

interface AvailabilityPreviewProps {
  divinerId: string;
  username: string;
  serviceId?: string | null;
  bookPath: string;
  durationMinutes: number;
  serviceName?: string;
  /** When true, show availability from all templates regardless of serviceId */
  allSlots?: boolean;
  /** Pre-built `?ref=<code>` query string (empty when no ref). */
  refParam?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  availabilityId?: string;
  availabilityTitle?: string;
  availabilityDescription?: string | null;
  availabilityTimezone?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  availabilityServiceId?: string | null;
  serviceSlug?: string | null;
}

interface BusyEntry {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "google" | "microsoft" | "booking" | "hold";
  details?: string | null;
}

interface AvailabilityDebugResponse {
  slots: TimeSlot[];
  busySchedule: BusyEntry[];
  timezone: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatSlotTime(iso: string, timezone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

export function AvailabilityPreview({
  divinerId,
  username,
  serviceId,
  bookPath,
  durationMinutes,
  serviceName,
  allSlots,
  refParam = "",
}: AvailabilityPreviewProps) {
  // Slot links already carry `?date=...&time=...` so any ref has to be
  // joined with '&'; keep a matching amp-form derived from the same value.
  const refAmp = refParam ? refParam.replace(/^\?/, "&") : "";
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [busySchedule, setBusySchedule] = useState<BusyEntry[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "busy">("available");
  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serviceQuery = allSlots
    ? "&allSlots=1"
    : serviceId
      ? `&serviceId=${serviceId}`
      : "";

  // Fetch which dates have availability this month
  useEffect(() => {
    async function fetchMonthAvailability() {
      setLoadingDates(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      try {
        const response = await fetch(
          `/api/availability/${divinerId}/month?month=${monthKey}&duration=${durationMinutes}${serviceQuery}`
        );
        const data = response.ok ? await response.json() : null;
        const dates = Array.isArray(data?.availableDates)
          ? new Set<string>(data.availableDates)
          : new Set<string>();
        setAvailableDates(dates);
      } catch {
        setAvailableDates(new Set());
      } finally {
        setLoadingDates(false);
      }
    }
    fetchMonthAvailability();
  }, [divinerId, currentMonth, durationMinutes, serviceQuery]);

  // Fetch time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const response = await fetch(
          `/api/availability/${divinerId}?date=${selectedDate}&duration=${durationMinutes}${serviceQuery}&debugBusy=1`
        );
        const data: AvailabilityDebugResponse | TimeSlot[] = response.ok ? await response.json() : [];
        if (Array.isArray(data)) {
          setTimeSlots(data);
          setBusySchedule([]);
        } else {
          setTimeSlots(Array.isArray(data.slots) ? data.slots : []);
          setBusySchedule(Array.isArray(data.busySchedule) ? data.busySchedule : []);
        }
      } catch {
        setTimeSlots([]);
        setBusySchedule([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, divinerId, durationMinutes, serviceQuery]);

  useEffect(() => {
    setActiveTab("available");
  }, [selectedDate]);

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const canGoPrev = new Date(year, month, 1) > today;

  return (
    <div className="mx-auto max-w-lg">
      {/* Calendar */}
      <div className="glass-card rounded-xl p-4">
        {/* Month header */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="rounded p-1 text-[#b8bcd0]/50 transition-colors hover:text-[#c9a84c] disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold text-[#f5f0e8]">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="rounded p-1 text-[#b8bcd0]/50 transition-colors hover:text-[#c9a84c]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-[#b8bcd0]/40">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = new Date(year, month, day) < today;
            const isAvailable = !isPast && availableDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = new Date(year, month, day).toDateString() === new Date().toDateString();

            return (
              <button
                key={day}
                disabled={isPast || !isAvailable}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative rounded-md py-1.5 text-xs transition-all ${
                  isSelected
                    ? "bg-[#c9a84c] font-bold text-black"
                    : isAvailable
                    ? "text-[#f5f0e8] hover:bg-[#c9a84c]/20"
                    : isPast
                    ? "text-[#b8bcd0]/20"
                    : "text-[#b8bcd0]/30"
                } ${isToday && !isSelected ? "ring-1 ring-[#c9a84c]/40" : ""}`}
              >
                {day}
                {isAvailable && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[#c9a84c]/60" />
                )}
              </button>
            );
          })}
        </div>

        {loadingDates && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#b8bcd0]/40">
            <div className="size-3 animate-spin rounded-full border border-[#c9a84c]/30 border-t-[#c9a84c]" />
            Loading availability...
          </div>
        )}
      </div>

      {/* Time slots (shown when date is selected) */}
      {selectedDate && (
        <div className="mt-3 glass-card rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#b8bcd0]/50">
                <Clock className="mr-1 inline size-3" />
                Available times for {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <p className="mt-1 text-[11px] text-[#b8bcd0]/45">
                Shown in your timezone: {viewerTimezone.replace(/_/g, " ")}
              </p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === "available"
                    ? "bg-[#c9a84c] text-black"
                    : "text-[#b8bcd0]/70 hover:text-[#f5f0e8]"
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("busy")}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === "busy"
                    ? "bg-[#c9a84c] text-black"
                    : "text-[#b8bcd0]/70 hover:text-[#f5f0e8]"
                }`}
              >
                Busy
              </button>
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-4">
              <div className="size-4 animate-spin rounded-full border-2 border-[#c9a84c]/30 border-t-[#c9a84c]" />
            </div>
          ) : activeTab === "available" ? (
            timeSlots.length > 0 ? (
            <>
              {(() => {
                // Group slots by availability template
                const groups: { id: string; title: string; startTime?: string; endTime?: string; timezone?: string; description?: string | null; serviceId?: string | null; slots: TimeSlot[] }[] = [];
                for (const slot of timeSlots) {
                  const groupId = slot.availabilityId ?? "__unscoped__";
                  let group = groups.find((g) => g.id === groupId);
                  if (!group) {
                    group = {
                      id: groupId,
                      title: slot.availabilityTitle ?? "",
                      startTime: slot.availabilityStartTime,
                      endTime: slot.availabilityEndTime,
                      timezone: slot.availabilityTimezone,
                      description: slot.availabilityDescription,
                      serviceId: slot.availabilityServiceId,
                      slots: [],
                    };
                    groups.push(group);
                  }
                  group.slots.push(slot);
                }

                return groups.map((group) => (
                  <div key={group.id} className="mb-4 last:mb-0">
                    {group.title && (
                      <div className="mb-3 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/8 px-3 py-2 text-left">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                          {group.title}
                        </p>
                        <p className="mt-1 text-xs text-[#b8bcd0]/70">
                          {group.startTime} - {group.endTime}
                          {group.timezone ? ` • ${group.timezone.replace(/_/g, " ")}` : ""}
                        </p>
                        {group.description && (
                          <div
                            className="mt-1 text-xs text-[#b8bcd0]/60 prose prose-sm prose-invert max-w-none [&_a]:text-amber-400 [&_a]:underline [&_a]:break-all [&_p]:my-1"
                            dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(group.description) }}
                          />
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.slots.map((slot) => {
                        // Link to the service the slot actually belongs to. If the slot isn't scoped
                        // to any service, fall back to the generic /book flow. Only use the page's
                        // default bookPath when we have no better info (legacy).
                        const slotPath = slot.availabilityServiceId == null
                          ? "/book"
                          : slot.serviceSlug
                            ? `/book/${slot.serviceSlug}`
                            : bookPath;
                        return (
                          <Link
                            key={slot.start}
                            href={`/${username}${slotPath}?date=${selectedDate}&time=${encodeURIComponent(slot.start)}${refAmp}`}
                            className="rounded-lg border border-white/8 bg-white/5 px-2 py-2 text-center text-xs font-medium text-[#f5f0e8] transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/10 hover:text-[#c9a84c]"
                          >
                            {formatSlotTime(slot.start)}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </>
            ) : (
            <p className="py-2 text-center text-xs text-[#b8bcd0]/40">No slots available this day</p>
            )
          ) : busySchedule.length > 0 ? (
            <div className="space-y-2">
              {busySchedule.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-white/8 bg-white/5 px-3 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#f5f0e8]">
                        {entry.title}
                      </p>
                      <p className="mt-1 text-xs text-[#b8bcd0]/70">
                        {formatSlotTime(entry.start)} -{" "}
                        {formatSlotTime(entry.end)}
                        {viewerTimezone ? ` • ${viewerTimezone.replace(/_/g, " ")}` : ""}
                      </p>
                      {entry.details && (
                        <p className="mt-1 text-xs text-[#b8bcd0]/55">
                          {entry.details}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c9a84c]">
                      {entry.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-xs text-[#b8bcd0]/40">
              No busy schedule found for this day.
            </p>
          )}
        </div>
      )}

      {/* See all link */}
      <div className="mt-3 text-center">
        <Link
          href={`/${username}${bookPath}${refParam}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c9a84c]/70 transition-colors hover:text-[#c9a84c]"
        >
          {allSlots ? "See All Available Times & Book" : `See All ${serviceName ?? "Available"} Times & Book`}
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
