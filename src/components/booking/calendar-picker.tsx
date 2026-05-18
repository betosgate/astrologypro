"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, startOfDay, addMonths } from "date-fns";

interface CalendarPickerProps {
  divinerId: string;
  serviceId?: string | null;
  duration: number;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | undefined;
  /** When true, fetch slots from all availability templates regardless of service */
  allSlots?: boolean;
  enableNextAvailableAssist?: boolean;
  scanMonthsAhead?: number;
  onNextAvailableMessage?: (message: string | null) => void;
  onNoAvailabilityFoundChange?: (found: boolean) => void;
}

export function CalendarPicker({
  divinerId,
  serviceId,
  duration,
  onDateSelect,
  selectedDate,
  allSlots,
  enableNextAvailableAssist = false,
  scanMonthsAhead = 6,
  onNextAvailableMessage,
  onNoAvailabilityFoundChange,
}: CalendarPickerProps) {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [loadedMonth, setLoadedMonth] = useState(false);
  const assistedMonthRef = useRef<string | null>(null);
  const autoJumpedMonthRef = useRef<string | null>(null);
  const serviceQuery = serviceId ? `&serviceId=${serviceId}` : "";
  const allSlotsQuery = allSlots ? "&allSlots=1" : "";

  function handleMonthChange(month: Date) {
    assistedMonthRef.current = null;
    autoJumpedMonthRef.current = null;
    onNextAvailableMessage?.(null);
    onNoAvailabilityFoundChange?.(false);
    setCurrentMonth(month);
  }

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
        const dates = Array.isArray(data?.availableDates) ? data.availableDates : [];

        if (enableNextAvailableAssist && dates.length === 0) {
          if (assistedMonthRef.current === monthKey) {
            setAvailableDates(new Set());
            return;
          }
          assistedMonthRef.current = monthKey;

          const result = await findNextAvailableMonth(currentMonth);

          if (result) {
            autoJumpedMonthRef.current = result.monthKey;
            setCurrentMonth(result.month);
            setAvailableDates(new Set(result.dates));
            onNoAvailabilityFoundChange?.(false);
            onNextAvailableMessage?.(
              `No availability in ${format(currentMonth, "MMMM yyyy")}. Showing next available dates in ${format(result.month, "MMMM yyyy")}.`
            );
          } else {
            setAvailableDates(new Set());
            onNoAvailabilityFoundChange?.(true);
            onNextAvailableMessage?.(
              `No availability found in the next ${scanMonthsAhead} months. Please choose another reader or try again later.`
            );
          }
        } else {
          setAvailableDates(new Set(dates));
          onNoAvailabilityFoundChange?.(false);
          if (autoJumpedMonthRef.current !== monthKey) {
            onNextAvailableMessage?.(null);
          }
        }
      } catch {
        // Silently handle fetch errors
        setAvailableDates(new Set());
      } finally {
        setLoadedMonth(true);
        setLoading(false);
      }
    }

    async function findNextAvailableMonth(startMonth: Date) {
      for (let i = 1; i <= scanMonthsAhead; i++) {
        const nextMonth = addMonths(startMonth, i);
        const monthKey = format(nextMonth, "yyyy-MM");

        const res = await fetch(
          `/api/availability/${divinerId}/month?month=${monthKey}&duration=${duration}${serviceQuery}${allSlotsQuery}`
        );

        const data = res.ok ? await res.json() : null;
        const dates = Array.isArray(data?.availableDates) ? data.availableDates : [];

        if (dates.length > 0) {
          return {
            month: nextMonth,
            monthKey,
            dates,
            firstDate: dates[0],
          };
        }
      }

      return null;
    }

    fetchMonthAvailability();
  }, [
    currentMonth,
    divinerId,
    duration,
    serviceQuery,
    allSlotsQuery,
    enableNextAvailableAssist,
    scanMonthsAhead,
    onNextAvailableMessage,
    onNoAvailabilityFoundChange,
  ]);

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
        month={currentMonth}
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onDateSelect(date);
        }}
        onMonthChange={handleMonthChange}
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
