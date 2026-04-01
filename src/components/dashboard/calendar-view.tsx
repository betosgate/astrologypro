"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, User, Plus } from "lucide-react";

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  client_name: string;
  service_name: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Override {
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface CalendarViewProps {
  divinerId?: string;
  timezone?: string;
  bookings: Booking[];
  availabilitySlots: AvailabilitySlot[];
  overrides: Override[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm

export function CalendarView({ bookings, availabilitySlots, overrides }: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  function isAvailable(dayOfWeek: number, hour: number) {
    return availabilitySlots.some(
      (s) =>
        s.day_of_week === dayOfWeek &&
        parseInt(s.start_time) <= hour &&
        parseInt(s.end_time) > hour
    );
  }

  function isBlocked(dateStr: string) {
    return overrides.some((o) => o.date === dateStr && !o.is_available);
  }

  function getBookingsForSlot(date: Date, hour: number) {
    return bookings.filter((b) => {
      const bDate = new Date(b.scheduled_at);
      return (
        bDate.toDateString() === date.toDateString() &&
        bDate.getHours() === hour
      );
    });
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div>
      {/* Week Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {formatDate(weekDates[0])} — {formatDate(weekDates[6])}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[800px] grid-cols-8 gap-px rounded-lg border bg-border">
          {/* Header */}
          <div className="bg-background p-2 text-center text-xs font-medium text-muted-foreground" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div
                key={i}
                className={`bg-background p-2 text-center text-xs font-medium ${
                  isToday ? "text-[#c9a84c]" : "text-muted-foreground"
                }`}
              >
                <div>{DAYS[date.getDay()]}</div>
                <div className={`text-lg ${isToday ? "font-bold" : ""}`}>{date.getDate()}</div>
              </div>
            );
          })}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <>
              <div key={`label-${hour}`} className="bg-background p-1 text-right text-[10px] text-muted-foreground">
                {hour > 12 ? hour - 12 : hour}{hour >= 12 ? "pm" : "am"}
              </div>
              {weekDates.map((date, dayIdx) => {
                const dateStr = date.toISOString().split("T")[0];
                const available = isAvailable(date.getDay(), hour);
                const blocked = isBlocked(dateStr);
                const slotBookings = getBookingsForSlot(date, hour);

                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className={`relative min-h-[40px] bg-background p-0.5 ${
                      blocked
                        ? "bg-red-950/20"
                        : available
                        ? "bg-green-950/20"
                        : ""
                    }`}
                  >
                    {slotBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded bg-[#c9a84c]/20 border border-[#c9a84c]/30 px-1 py-0.5 text-[9px] text-[#c9a84c] truncate"
                        title={`${b.client_name} — ${b.service_name}`}
                      >
                        <User className="inline size-2 mr-0.5" />
                        {b.client_name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-green-950/30 border border-green-900/30" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-[#c9a84c]/20 border border-[#c9a84c]/30" /> Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-red-950/30 border border-red-900/30" /> Blocked
        </span>
      </div>
    </div>
  );
}
