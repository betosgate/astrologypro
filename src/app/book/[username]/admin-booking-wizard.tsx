"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Slot = {
  start: string;
  end: string;
};

type SlotsResponse = {
  username: string;
  date: string;
  durationMinutes: number;
  timezone: string;
  slots: Slot[];
};

type Step = "pick-time" | "details" | "done";

interface Props {
  username: string;
  defaultTimezone: string;
  defaultDurationMinutes: number;
}

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatSlotLabel(iso: string, timezone: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFullDate(iso: string, timezone: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
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

export function AdminBookingWizard({
  username,
  defaultTimezone,
  defaultDurationMinutes,
}: Props) {
  const [step, setStep] = useState<Step>("pick-time");
  const [date, setDate] = useState<string>(todayIsoDate());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    defaultDurationMinutes,
  );
  const [timezone, setTimezone] = useState<string>(defaultTimezone);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Slot | null>(null);

  const loadSlots = useCallback(
    async (targetDate: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/book/${encodeURIComponent(username)}/slots?date=${encodeURIComponent(targetDate)}`,
        );
        const json: SlotsResponse | { error: string } = await res.json();
        if (!res.ok) {
          setError(("error" in json && json.error) || "Failed to load slots.");
          setSlots([]);
          return;
        }
        const data = json as SlotsResponse;
        setSlots(data.slots);
        setDurationMinutes(data.durationMinutes);
        setTimezone(data.timezone);
      } catch (err) {
        console.error(err);
        setError("Failed to load slots.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    },
    [username],
  );

  useEffect(() => {
    loadSlots(date);
  }, [date, loadSlots]);

  const sortedSlots = useMemo(
    () =>
      [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [slots],
  );

  async function handleSubmit() {
    if (!selectedSlot) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/book/${encodeURIComponent(username)}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: selectedSlot.start,
          durationMinutes,
          timezone,
          clientName: name,
          clientEmail: email,
          clientNote: note,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json?.error ?? "Failed to create booking.");
        return;
      }
      setConfirmation(selectedSlot);
      setStep("done");
    } catch (err) {
      console.error(err);
      setFormError("Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" && confirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You&rsquo;re booked</CardTitle>
          <CardDescription>
            A confirmation has been recorded for the time below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <div className="font-medium">
              {formatFullDate(confirmation.start, timezone)}
            </div>
            <div className="text-muted-foreground mt-1">
              {durationMinutes} minutes
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            We&rsquo;ve noted {email || "your email"}. You can close this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Pick a date</CardTitle>
          <CardDescription>All times in {timezone}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="booking-date">Date</Label>
            <Input
              id="booking-date"
              type="date"
              value={date}
              min={todayIsoDate()}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
                if (step !== "pick-time") setStep("pick-time");
              }}
            />
          </div>
          <div className="text-muted-foreground text-xs">
            Slot length: {durationMinutes} minutes
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === "details" ? "Your details" : "Available times"}
          </CardTitle>
          <CardDescription>
            {step === "details"
              ? "Just a few quick fields."
              : loading
                ? "Loading…"
                : error
                  ? error
                  : sortedSlots.length === 0
                    ? "No times available on this date."
                    : `${sortedSlots.length} slot${sortedSlots.length === 1 ? "" : "s"} available`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "pick-time" && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sortedSlots.map((slot) => {
                  const active = selectedSlot?.start === slot.start;
                  return (
                    <Button
                      key={slot.start}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatSlotLabel(slot.start, timezone)}
                    </Button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={!selectedSlot}
                  onClick={() => setStep("details")}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === "details" && selectedSlot && (
            <>
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="font-medium">
                  {formatFullDate(selectedSlot.start, timezone)}
                </div>
                <div className="text-muted-foreground mt-1">
                  {durationMinutes} minutes
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="client-name">Name</Label>
                  <Input
                    id="client-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="client-note">Note (optional)</Label>
                  <Textarea
                    id="client-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Anything you want us to know?"
                  />
                </div>
              </div>
              {formError && (
                <p className="text-destructive text-sm">{formError}</p>
              )}
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep("pick-time")}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim() || !email.trim()}
                >
                  {submitting ? "Booking…" : "Confirm booking"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
