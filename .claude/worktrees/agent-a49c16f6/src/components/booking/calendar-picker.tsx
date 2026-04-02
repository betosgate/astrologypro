"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format, startOfMonth, endOfMonth, isBefore, startOfDay } from "date-fns";

interface CalendarPickerProps {
  divinerId: string;
  duration: number;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | undefined;
}

export function CalendarPicker({
  divinerId,
  duration,
  onDateSelect,
  selectedDate,
}: CalendarPickerProps) {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMonthAvailability() {
      setLoading(true);
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const dates = new Set<string>();

        // Check each day in the month for availability
        let day = start;
        const today = startOfDay(new Date());

        while (day <= end) {
          if (!isBefore(day, today)) {
            const dateStr = format(day, "yyyy-MM-dd");
            const res = await fetch(
              `/api/availability/${divinerId}?date=${dateStr}&duration=${duration}`
            );
            if (res.ok) {
              const slots = await res.json();
              if (slots.length > 0) {
                dates.add(dateStr);
              }
            }
          }
          day = addDays(day, 1);
        }

        setAvailableDates(dates);
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }

    fetchMonthAvailability();
  }, [currentMonth, divinerId, duration]);

  const today = startOfDay(new Date());

  return (
    <div className="flex flex-col items-center">
      {loading && (
        <p className="mb-2 text-sm text-muted-foreground animate-pulse">
          Loading availability...
        </p>
      )}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onDateSelect(date);
        }}
        onMonthChange={setCurrentMonth}
        disabled={(date) => {
          if (isBefore(date, today)) return true;
          const dateStr = format(date, "yyyy-MM-dd");
          // If we have loaded availability data and this date has no slots, disable it
          if (availableDates.size > 0 && !availableDates.has(dateStr)) {
            return true;
          }
          return false;
        }}
        className="rounded-md border"
      />
    </div>
  );
}
