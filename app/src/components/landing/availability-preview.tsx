"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface AvailabilityPreviewProps {
  divinerId: string;
  username: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function AvailabilityPreview({ divinerId, username }: AvailabilityPreviewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch which dates have availability this month
  useEffect(() => {
    async function fetchMonthAvailability() {
      setLoadingDates(true);
      const dates = new Set<string>();

      // Check each day of the month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const promises = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        if (date < today) continue;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        promises.push(
          fetch(`/api/availability/${divinerId}?date=${dateStr}&duration=60`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
              if (data && Array.isArray(data) && data.length > 0) {
                dates.add(dateStr);
              }
            })
            .catch(() => {})
        );
      }

      // Batch in groups of 7 to not overload
      for (let i = 0; i < promises.length; i += 7) {
        await Promise.all(promises.slice(i, i + 7));
      }

      setAvailableDates(dates);
      setLoadingDates(false);
    }
    fetchMonthAvailability();
  }, [divinerId, currentMonth]);

  // Fetch time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    fetch(`/api/availability/${divinerId}?date=${selectedDate}&duration=60`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTimeSlots(Array.isArray(data) ? data : []))
      .catch(() => setTimeSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, divinerId]);

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const canGoPrev = new Date(year, month, 1) > today;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

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
            const isAvailable = availableDates.has(dateStr);
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#b8bcd0]/50">
            <Clock className="mr-1 inline size-3" />
            Available times for {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-4">
              <div className="size-4 animate-spin rounded-full border-2 border-[#c9a84c]/30 border-t-[#c9a84c]" />
            </div>
          ) : timeSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timeSlots.map((slot) => (
                <Link
                  key={slot.start}
                  href={`/${username}/book/natal-chart?date=${selectedDate}&time=${encodeURIComponent(slot.start)}`}
                  className="rounded-lg border border-white/8 bg-white/5 px-2 py-2 text-center text-xs font-medium text-[#f5f0e8] transition-all hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/10 hover:text-[#c9a84c]"
                >
                  {formatTime(slot.start)}
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-xs text-[#b8bcd0]/40">No slots available this day</p>
          )}
        </div>
      )}

      {/* See all link */}
      <div className="mt-3 text-center">
        <Link
          href={`/${username}/book/natal-chart`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c9a84c]/70 transition-colors hover:text-[#c9a84c]"
        >
          See All Available Times & Book
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
