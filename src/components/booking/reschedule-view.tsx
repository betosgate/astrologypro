"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPicker } from "./calendar-picker";
import {
  CheckCircle,
  CalendarClock,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { formatInTimezone } from "@/lib/timezone-utils";
import Link from "next/link";

interface TimeSlot {
  start: string;
  end: string;
  availabilityId?: string;
  availabilityTitle?: string;
}

interface RescheduleViewProps {
  bookingId: string;
  divinerId: string;
  divinerDisplayName: string;
  serviceName: string;
  durationMinutes: number;
  serviceId: string | null;
  clientName: string | null;
  currentScheduledAt: string;
}

function formatSlotTime(iso: string, timezone: string): string {
  return formatInTimezone(iso, timezone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatSlotDate(iso: string, timezone: string): string {
  return formatInTimezone(iso, timezone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function RescheduleView({
  bookingId,
  divinerId,
  divinerDisplayName,
  serviceName,
  durationMinutes,
  serviceId,
  clientName,
  currentScheduledAt,
}: RescheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<"pick" | "confirm" | "done">("pick");
  const [submitting, setSubmitting] = useState(false);
  const [clientTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const availabilityQuery = serviceId ? `&serviceId=${serviceId}` : "";

  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const res = await fetch(
          `/api/availability/${divinerId}?date=${dateStr}&duration=${durationMinutes}${availabilityQuery}`
        );
        if (res.ok) {
          const slots: TimeSlot[] = await res.json();
          setTimeSlots(slots);
        } else {
          setTimeSlots([]);
          toast.error("Could not load available times. Try again.");
        }
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, divinerId, durationMinutes, availabilityQuery]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const slotDate = new Date(selectedSlot.start);
      const newDate = format(slotDate, "yyyy-MM-dd");
      const newTime = format(slotDate, "HH:mm");
      const res = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_date: newDate,
          new_time: newTime,
          timezone: clientTimezone,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to reschedule");
      }
      setStep("done");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-8 text-center space-y-4">
          <CheckCircle className="mx-auto size-16 text-green-500" />
          <h2 className="text-2xl font-bold">Booking Rescheduled!</h2>
          {selectedSlot && (
            <p className="text-muted-foreground">
              {clientName ? `${clientName}'s` : "The"}{" "}
              <strong className="text-foreground">{serviceName}</strong> with{" "}
              {divinerDisplayName} has been moved to{" "}
              <strong className="text-foreground">
                {formatSlotDate(selectedSlot.start, clientTimezone)}
              </strong>{" "}
              at{" "}
              <strong className="text-foreground">
                {formatSlotTime(selectedSlot.start, clientTimezone)}
              </strong>
              .
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            The client has been notified by email.
          </p>
          <Button asChild className="w-full mt-2">
            <Link href="/dashboard/calendar">
              <ArrowLeft className="mr-2 size-4" />
              Back to Calendar
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Pick slot ──────────────────────────────────────────────────────────────
  if (step === "pick") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Pick a New Date &amp; Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <CalendarPicker
              divinerId={divinerId}
              serviceId={serviceId}
              duration={durationMinutes}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />

            <div className="w-full flex-1">
              {selectedDate ? (
                <>
                  <h3 className="mb-3 font-medium">
                    Available times for {format(selectedDate, "EEEE, MMMM d")}
                  </h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Times shown in{" "}
                    <span className="font-medium text-foreground">
                      {clientTimezone.replace(/_/g, " ")}
                    </span>
                  </p>

                  {loadingSlots ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-lg bg-white/5" />
                      ))}
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No available times on this date. Try another day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.start}
                          variant={
                            selectedSlot?.start === slot.start
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                          className="justify-center"
                        >
                          {formatSlotTime(slot.start, clientTimezone)}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a date to see available times.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              disabled={!selectedSlot}
              onClick={() => setStep("confirm")}
              className="gap-2"
            >
              Review &amp; Confirm
              <CalendarClock className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Confirm ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          Confirm Reschedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSlot && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session</span>
              <span className="font-medium">{serviceName}</span>
            </div>
            {clientName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{clientName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Date</span>
              <span className="font-medium text-right">
                {formatSlotDate(selectedSlot.start, clientTimezone)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Time</span>
              <span className="font-medium">
                {formatSlotTime(selectedSlot.start, clientTimezone)} –{" "}
                {formatSlotTime(selectedSlot.end, clientTimezone)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{durationMinutes} min</span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          The client will receive a reschedule confirmation email.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep("pick")}
            disabled={submitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CalendarClock className="mr-2 size-4" />
            )}
            Confirm Reschedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
