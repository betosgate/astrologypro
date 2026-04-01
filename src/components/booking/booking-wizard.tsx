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
  ExternalLink,
  Mail,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

// Inner payment form that uses Stripe hooks
function StripePaymentForm({
  onSuccess,
  onError,
  submitting,
  setSubmitting,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    onError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: "tabs",
        }}
      />
      {!ready && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading payment form...
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || !elements || submitting || !ready}
        className="w-full gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <CreditCard className="size-4" />
            Pay Now
          </>
        )}
      </Button>
    </form>
  );
}

export function BookingWizard({ diviner, service }: BookingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>(INITIAL_INTAKE);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Prefill intake data from stored client profile when ?prefill=true
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("prefill") !== "true") return;

    async function prefillFromProfile() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: client } = await supabase
          .from("clients")
          .select(
            "full_name, email, phone, birth_date, birth_time, birth_city"
          )
          .eq("email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!client) return;

        setIntakeData((prev) => ({
          fullName: client.full_name || prev.fullName,
          email: client.email || user.email || prev.email,
          phone: client.phone || prev.phone,
          birthDate: client.birth_date || prev.birthDate,
          birthTime: client.birth_time || prev.birthTime,
          birthCity: client.birth_city || prev.birthCity,
          focusQuestion: prev.focusQuestion,
          lifeArea: prev.lifeArea,
        }));
        setPrefilled(true);
      } catch {
        // Silently fail — user can fill in manually
      }
    }

    prefillFromProfile();
  }, []);

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

  async function handleCreatePaymentIntent() {
    setCreatingPaymentIntent(true);
    setError(null);

    try {
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

      const data = await res.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        if (data.bookingId) {
          setBookingId(data.bookingId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreatingPaymentIntent(false);
    }
  }

  // Create the payment intent when arriving at step 2
  useEffect(() => {
    if (step === 2 && !clientSecret && !creatingPaymentIntent) {
      handleCreatePaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handlePaymentSuccess() {
    setSubmitting(false);
    setBookingComplete(true);
  }

  function handlePaymentError(msg: string) {
    setError(msg || null);
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

  const sessionJoinUrl = bookingId
    ? `/${diviner.username}/session/${bookingId}`
    : null;

  // Confirmation screen
  if (bookingComplete) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold">Booking Confirmed!</h2>
          <p className="mb-6 text-muted-foreground">
            Your {service.name} reading with {diviner.display_name} has been
            booked.
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

          {/* Session Join Link */}
          {sessionJoinUrl && (
            <Button
              asChild
              className="mb-4 w-full gap-2 bg-amber-600 text-white hover:bg-amber-700"
              size="lg"
            >
              <a href={sessionJoinUrl}>
                <ExternalLink className="size-4" />
                Join Your Session
              </a>
            </Button>
          )}

          {/* Add to Calendar */}
          <Button asChild variant="outline" className="mb-4 w-full gap-2">
            <a href={generateIcsUrl()} download="booking.ics">
              <Download className="size-4" />
              Add to Calendar (.ics)
            </a>
          </Button>

          {/* Email notice */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" />
            <span>You will also receive an email with these details.</span>
          </div>
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
            <>
              {prefilled && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                  Welcome back! Your details are pre-filled from your last
                  session. Feel free to update anything before continuing.
                </div>
              )}
              <IntakeForm
                requiresBirthData={service.requires_birth_data}
                data={intakeData}
                onChange={setIntakeData}
              />
            </>
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

              {/* Stripe Elements Payment Form */}
              {creatingPaymentIntent && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Preparing payment...
                </div>
              )}

              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#d4a017",
                        colorBackground: "#0a0a0a",
                        colorText: "#fafafa",
                        colorDanger: "#ef4444",
                        borderRadius: "8px",
                        fontFamily: "inherit",
                      },
                    },
                  }}
                >
                  <StripePaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                  />
                </Elements>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 2) {
              // Reset payment state when going back from payment step
              setClientSecret(null);
              setError(null);
            }
            setStep((s) => s - 1);
          }}
          disabled={step === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}

        {/* No "Proceed to Payment" button on step 2 -- the Stripe form handles it */}
      </div>
    </div>
  );
}
