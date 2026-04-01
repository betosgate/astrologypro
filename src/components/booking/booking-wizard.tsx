"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarPicker } from "./calendar-picker";
import { IntakeForm, type IntakeData } from "./intake-form";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Calendar,
  CreditCard,
  Loader2,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  price?: number;
  category: string;
  requires_birth_data: boolean;
}

interface Diviner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface BookingWizardProps {
  diviner: Diviner;
  service: Service;
}

const STEPS = [
  { label: "Date & Time", icon: Calendar },
  { label: "Your Details", icon: CreditCard },
  { label: "Confirm & Pay", icon: CheckCircle },
];

const INITIAL_INTAKE: IntakeData = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  birthTime: "",
  birthCity: "",
  focusQuestion: "",
  lifeArea: "",
};

export function BookingWizard({ diviner, service }: BookingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>(INITIAL_INTAKE);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect client timezone
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Fetch time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const res = await fetch(
          `/api/availability/${diviner.id}?date=${dateStr}&duration=${service.duration_minutes}`
        );
        if (res.ok) {
          const slots: TimeSlot[] = await res.json();
          setTimeSlots(slots);
        } else {
          setTimeSlots([]);
        }
      } catch {
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, diviner.id, service.duration_minutes]);

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return !!selectedSlot;
      case 1:
        return !!(
          intakeData.fullName.trim() &&
          intakeData.email.trim() &&
          intakeData.focusQuestion.trim() &&
          intakeData.lifeArea
        );
      case 2:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmitBooking() {
    setSubmitting(true);
    setError(null);

    try {
      // Check for affiliate code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const affiliateCode = urlParams.get("ref") || undefined;

      const res = await fetch("/api/stripe/booking-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divinerId: diviner.id,
          serviceId: service.id,
          scheduledAt: selectedSlot!.start,
          clientEmail: intakeData.email,
          clientName: intakeData.fullName,
          clientPhone: intakeData.phone || undefined,
          questionnaire: {
            focusQuestion: intakeData.focusQuestion,
            lifeArea: intakeData.lifeArea,
            birthDate: intakeData.birthDate || undefined,
            birthTime: intakeData.birthTime || undefined,
            birthCity: intakeData.birthCity || undefined,
          },
          affiliateCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }

      const { clientSecret, redirectUrl } = await res.json();

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // If using Stripe Elements, clientSecret would be used here
      // For now, mark as complete (Stripe Elements integration would go here)
      if (clientSecret) {
        // TODO: Integrate Stripe Elements payment form
        setBookingComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function generateIcsUrl(): string {
    if (!selectedSlot) return "#";
    const startDate = new Date(selectedSlot.start);
    const endDate = new Date(selectedSlot.end);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatIcs = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${formatIcs(startDate)}`,
      `DTEND:${formatIcs(endDate)}`,
      `SUMMARY:${service.name} with ${diviner.display_name}`,
      `DESCRIPTION:${service.name} reading session`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  }

  // Confirmation screen
  if (bookingComplete) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold">Booking Confirmed!</h2>
          <p className="mb-6 text-muted-foreground">
            Your {service.name} reading with {diviner.display_name} has been
            booked. Check your email for confirmation details.
          </p>

          {selectedSlot && (
            <div className="mb-6 rounded-lg border p-4 text-left">
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedSlot.start), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedSlot.start), "h:mm a")} -{" "}
                {format(new Date(selectedSlot.end), "h:mm a")} ({clientTimezone})
              </p>
            </div>
          )}

          <Button asChild variant="outline" className="gap-2">
            <a href={generateIcsUrl()} download="booking.ics">
              <Download className="size-4" />
              Add to Calendar (.ics)
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Indicator */}
      <nav className="mb-8">
        <ol className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-8",
                      i < step ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Date & Time */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <CalendarPicker
                  divinerId={diviner.id}
                  duration={service.duration_minutes}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />

                <div className="w-full flex-1">
                  {selectedDate && (
                    <>
                      <h3 className="mb-3 font-medium">
                        Available times for{" "}
                        {format(selectedDate, "EEEE, MMMM d")}
                      </h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Times shown in your timezone ({clientTimezone})
                      </p>

                      {loadingSlots ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading times...
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No available times on this date.
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
                              {format(new Date(slot.start), "h:mm a")}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {!selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Select a date to see available times.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Intake Questionnaire */}
          {step === 1 && (
            <IntakeForm
              requiresBirthData={service.requires_birth_data}
              data={intakeData}
              onChange={setIntakeData}
            />
          )}

          {/* Step 3: Payment & Confirmation */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Booking Summary</h3>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{service.name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <Badge variant="outline">
                    <Clock className="mr-1 size-3" />
                    {service.duration_minutes} min
                  </Badge>
                </div>
                <Separator />
                {selectedSlot && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {format(
                          new Date(selectedSlot.start),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">
                        {format(new Date(selectedSlot.start), "h:mm a")} -{" "}
                        {format(new Date(selectedSlot.end), "h:mm a")}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{intakeData.fullName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">
                    {formatCurrency(Number(service.base_price ?? service.price ?? 0))}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmitBooking}
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="size-4" />
                Proceed to Payment
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
