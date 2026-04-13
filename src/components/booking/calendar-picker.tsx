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
  /** When true, fetch slots from all availability templates regardless of service */
  allSlots?: boolean;
}

export function CalendarPicker({
  divinerId,
  serviceId,
  duration,
  onDateSelect,
  selectedDate,
  allSlots,
}: CalendarPickerProps) {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [loadedMonth, setLoadedMonth] = useState(false);
  const serviceQuery = serviceId ? `&serviceId=${serviceId}` : "";
  const allSlotsQuery = allSlots ? "&allSlots=1" : "";

  useEffect(() => {
    async function fetchMonthAvailability() {
      setLoading(true);
      setLoadedMonth(false);
      try {
        const monthKey = format(currentMonth, "yyyy-MM");
        const res = await fetch(
          `/api/availability/${divinerId}/month?month=${monthKey}&duration=${duration}${serviceQuery}${allSlotsQuery}`
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
  }, [currentMonth, divinerId, duration, serviceQuery, allSlotsQuery]);

  const today = startOfDay(new Date());

  return (
    <div className="relative flex flex-col items-center">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Loading availability...</p>
          </div>
        </div>
      )}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onDateSelect(date);
        }}
        onMonthChange={setCurrentMonth}
        disabled={(date) => {
          if (loading) return true;
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
