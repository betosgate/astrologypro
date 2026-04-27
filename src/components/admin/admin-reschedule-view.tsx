"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

type Slot = {
  start: string;
  end: string;
};

type MonthResponse = {
  availableDates: string[];
  durationMinutes: number;
  timezone: string;
};

type SlotsResponse = {
  date: string;
  durationMinutes: number;
  timezone: string;
  slots: Slot[];
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatSlotTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatFullDate(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

interface Props {
  bookingId: string;
  adminUsername: string;
  defaultDurationMinutes: number;
  defaultTimezone: string;
  currentScheduledAt: string;
  clientName: string;
  clientEmail: string;
  /**
   * Where the back/cancel/done-state buttons navigate. Defaults to the
   * admin dashboard. Trainee/client callers override to `/trainee/sessions`.
   */
  backHref?: string;
  /** Label shown inside the "done" state Back button. */
  backLabel?: string;
}

export function AdminRescheduleView({
  bookingId,
  adminUsername,
  defaultDurationMinutes,
  defaultTimezone,
  currentScheduledAt,
  clientName,
  clientEmail,
  backHref = "/admin/my-bookings",
  backLabel = "Back to My Bookings",
}: Props) {
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    try {
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const res = await fetch(
        `/api/book/${encodeURIComponent(adminUsername)}/month?month=${monthKey}&duration=${duration}`
      );
      if (!res.ok) {
        setAvailableDates(new Set());
        return;
      }
      const data = (await res.json()) as MonthResponse;
      setAvailableDates(new Set(data.availableDates ?? []));
      if (data.timezone) setTimezone(data.timezone);
      if (data.durationMinutes) setDuration(data.durationMinutes);
    } catch {
      setAvailableDates(new Set());
    } finally {
      setLoadingMonth(false);
    }
  }, [adminUsername, duration, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(
          `/api/book/${encodeURIComponent(adminUsername)}/slots?date=${selectedDate}&duration=${duration}`
        );
        if (!res.ok) {
          if (!cancelled) setSlots([]);
          return;
        }
        const data = (await res.json()) as SlotsResponse;
        if (!cancelled) {
          setSlots(data.slots ?? []);
          if (data.timezone) setTimezone(data.timezone);
        }
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [adminUsername, duration, selectedDate]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/my-bookings/${bookingId}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ scheduled_at: selectedSlot.start }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reschedule");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Failed to reschedule");
    } finally {
      setSubmitting(false);
    }
  }

  const canGoPrev = new Date(year, month, 1) > today;

  if (done) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 py-8 text-center">
          <CheckCircle className="mx-auto size-14 text-green-500" />
          <h2 className="text-2xl font-bold">Booking Rescheduled</h2>
          {selectedSlot && (
            <p className="text-muted-foreground">
              {clientName}&apos;s session has been moved to{" "}
              <strong className="text-foreground">
                {formatFullDate(selectedSlot.start, timezone)}
              </strong>
              .
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {clientEmail} has been notified by email.
          </p>
          <Button asChild className="mt-2 w-full">
            <Link href={backHref}>
              <ArrowLeft className="mr-2 size-4" />
              {backLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4" />
            Pick a new date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayDate = new Date(year, month, day);
              const isPast = dayDate < today;
              const isAvailable = !isPast && availableDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dayDate.toDateString() === new Date().toDateString();
              return (
                <button
                  type="button"
                  key={day}
                  disabled={!isAvailable}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative rounded-md py-1.5 text-xs transition-all ${
                    isSelected
                      ? "bg-primary font-bold text-primary-foreground"
                      : isAvailable
                        ? "hover:bg-primary/15"
                        : isPast
                          ? "text-muted-foreground/30"
                          : "text-muted-foreground/40"
                  } ${isToday && !isSelected ? "ring-1 ring-primary/40" : ""}`}
                >
                  {day}
                  {isAvailable && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary/70" />
                  )}
                </button>
              );
            })}
          </div>

          {loadingMonth && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading availability…
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Pick a time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSlots ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded-md bg-muted" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No available times on this date. Try another day.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <Button
                    key={slot.start}
                    size="sm"
                    variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                    onClick={() => setSelectedSlot(slot)}
                    className="justify-center"
                  >
                    {formatSlotTime(slot.start, timezone)}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <p className="text-muted-foreground">Current session time</p>
          <p className="font-medium">
            {formatFullDate(currentScheduledAt, timezone)}
          </p>
          {selectedSlot && (
            <>
              <p className="mt-2 text-muted-foreground">New session time</p>
              <p className="font-medium text-primary">
                {formatFullDate(selectedSlot.start, timezone)}
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(backHref)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitting}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Rescheduling…
              </>
            ) : (
              <>
                Confirm Reschedule
                <CalendarClock className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
