"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, startOfDay } from "date-fns";

interface CalendarPickerProps {
  divinerId: string;
  serviceId?: string | null;
  duration: number;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | undefined;
}

export function CalendarPicker({
  divinerId,
  serviceId,
  duration,
  onDateSelect,
  selectedDate,
}: CalendarPickerProps) {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [loadedMonth, setLoadedMonth] = useState(false);
  const serviceQuery = serviceId ? `&serviceId=${serviceId}` : "";

  useEffect(() => {
    async function fetchMonthAvailability() {
      setLoading(true);
      setLoadedMonth(false);
      try {
        const monthKey = format(currentMonth, "yyyy-MM");
        const res = await fetch(
          `/api/availability/${divinerId}/month?month=${monthKey}&duration=${duration}${serviceQuery}`
        );
        const data = res.ok ? await res.json() : null;
        setAvailableDates(
          new Set(Array.isArray(data?.availableDates) ? data.availableDates : [])
        );
      } catch {
        // Silently handle fetch errors
        setAvailableDates(new Set());
      } finally {
        setLoadedMonth(true);
        setLoading(false);
      }
    }

    fetchMonthAvailability();
  }, [currentMonth, divinerId, duration, serviceQuery]);

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
          if (loadedMonth && !availableDates.has(dateStr)) {
            return true;
          }
          return false;
        }}
        className="rounded-md border"
      />
    </div>
  );
}
