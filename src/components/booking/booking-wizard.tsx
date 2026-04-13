"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatInTimezone } from "@/lib/timezone-utils";
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
  availabilityId?: string;
  availabilityTitle?: string;
  availabilityDescription?: string | null;
  availabilityTimezone?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  availabilitySlotIntervalMinutes?: number;
  availabilityServiceId?: string | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  source?: "template" | "legacy" | "override";
}

interface BookingWizardProps {
  diviner: Diviner;
  service: Service;
  availabilityServiceId?: string | null;
  bookingLabel?: string;
  hideServiceName?: boolean;
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
  secondPersonName: "",
  secondPersonAttending: "",
  secondPersonEmail: "",
  secondPersonBirthDate: "",
  secondPersonBirthTime: "",
  secondPersonBirthCity: "",
  extras: {},
};

function formatSlotDate(iso: string, timezone: string): string {
  return formatInTimezone(iso, timezone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatSlotTime(iso: string, timezone: string): string {
  return formatInTimezone(iso, timezone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Decodes HTML entities and renders as HTML. Handles double-escaped content. */
function DescriptionHtml({ html }: { html: string }) {
  // Decode HTML entities (handles double-escaped like &lt;p&gt; → <p>)
  let decoded = html;
  // Keep decoding until no more entities remain
  const entityPattern = /&(?:lt|gt|amp|quot|#39|#x27|nbsp);/i;
  let iterations = 0;
  while (entityPattern.test(decoded) && iterations < 3) {
    decoded = decoded
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&#x27;/gi, "'")
      .replace(/&nbsp;/gi, " ");
    iterations++;
  }

  return (
    <div
      className="mt-2 text-sm text-muted-foreground prose prose-invert prose-sm max-w-none [&_a]:text-amber-400 [&_a]:underline [&_a]:break-all"
      dangerouslySetInnerHTML={{ __html: decoded }}
    />
  );
}

// Inner payment form that uses Stripe hooks
function StripePaymentForm({
  onSuccess,
  onError,
  submitting,
  setSubmitting,
  policyAcknowledged,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  policyAcknowledged: boolean;
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
        disabled={!stripe || !elements || submitting || !ready || !policyAcknowledged}
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

export function BookingWizard({
  diviner,
  service,
  availabilityServiceId,
  bookingLabel,
  hideServiceName = false,
}: BookingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>(INITIAL_INTAKE);
  const [bookingNotes, setBookingNotes] = useState("");
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Stable session token for slot holds (persists for the lifetime of this wizard)
  const [sessionToken] = useState(() =>
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [requestedTimeIso, setRequestedTimeIso] = useState<string | null>(null);
  const [hasAutoAdvancedFromQuery, setHasAutoAdvancedFromQuery] = useState(false);
  const [clientTimezone, setClientTimezone] = useState(diviner.timezone || "UTC");
  const resolvedServiceName = hideServiceName ? (bookingLabel ?? "Reading Session") : (bookingLabel ?? service.name);
  const availabilityQuery = availabilityServiceId ? `&serviceId=${availabilityServiceId}` : "";

  // Effective price: slot's linked service price takes priority over the service prop's base_price
  const effectivePrice = selectedSlot?.servicePrice != null
    ? selectedSlot.servicePrice
    : Number(service.base_price ?? service.price ?? 0);
  const isFreeBooking = effectivePrice <= 0;

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
          ...prev,
          fullName: client.full_name || prev.fullName,
          email: client.email || user.email || prev.email,
          phone: client.phone || prev.phone,
          birthDate: client.birth_date || prev.birthDate,
          birthTime: client.birth_time || prev.birthTime,
          birthCity: client.birth_city || prev.birthCity,
        }));
        setPrefilled(true);
      } catch {
        // Non-critical — user can fill in manually
        console.warn("[BookingWizard] Could not prefill from profile");
      }
    }

    prefillFromProfile();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get("date");
    const time = urlParams.get("time");

    if (date) {
      const nextDate = new Date(`${date}T12:00:00`);
      if (!Number.isNaN(nextDate.getTime())) {
        setSelectedDate(nextDate);
      }
    }

    if (time) {
      setRequestedTimeIso(time);
    }

    if (date && time && !hasAutoAdvancedFromQuery) {
      setStep(1);
      setHasAutoAdvancedFromQuery(true);
    }
  }, [hasAutoAdvancedFromQuery]);

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detectedTimezone) {
      setClientTimezone(detectedTimezone);
    }
  }, []);

  // Fetch time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;

    // Capture requestedTimeIso at effect start so clearing it doesn't re-trigger
    const pendingTimeIso = requestedTimeIso;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const res = await fetch(
          `/api/availability/${diviner.id}?date=${dateStr}&duration=${service.duration_minutes}${availabilityQuery}`
        );
        if (res.ok) {
          const slots: TimeSlot[] = await res.json();
          setTimeSlots(slots);
          if (pendingTimeIso) {
            const requestedSlot = slots.find((slot) => slot.start === pendingTimeIso);
            if (requestedSlot) {
              setSelectedSlot(requestedSlot);
            }
            setRequestedTimeIso(null);
          }
        } else {
          setTimeSlots([]);
          toast.error("Could not load available times. Please try again.");
        }
      } catch {
        setTimeSlots([]);
        toast.error("Could not load available times. Please check your connection.");
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedDate,
    diviner.id,
    service.duration_minutes,
    availabilityQuery,
  ]);

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return !!selectedSlot;
      case 1:
        return !!(
          selectedSlot &&
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const res = await fetch("/api/stripe/booking-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          divinerId: diviner.id,
          divinerUsername: diviner.username,
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
            birthLat: intakeData.birthLat,
            birthLng: intakeData.birthLng,
            birthTimezone: intakeData.birthTimezone,
            secondPersonName: intakeData.secondPersonName || undefined,
            secondPersonAttending: intakeData.secondPersonAttending || undefined,
            secondPersonEmail: intakeData.secondPersonEmail || undefined,
            secondPersonBirthDate: intakeData.secondPersonBirthDate || undefined,
            secondPersonBirthTime: intakeData.secondPersonBirthTime || undefined,
            secondPersonBirthCity: intakeData.secondPersonBirthCity || undefined,
            secondPersonBirthLat: intakeData.secondPersonBirthLat,
            secondPersonBirthLng: intakeData.secondPersonBirthLng,
            secondPersonBirthTimezone: intakeData.secondPersonBirthTimezone,
            ...intakeData.extras,
          },
          affiliateCode,
          booking_notes: bookingNotes.trim() || undefined,
          policyAcknowledgedAt: policyAcknowledged ? new Date().toISOString() : undefined,
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Payment setup failed (${res.status})`);
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
      } else if (data.bookingId) {
        setBookingId(data.bookingId);
        setBookingComplete(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Payment setup timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setCreatingPaymentIntent(false);
    }
  }

  // Create the payment intent immediately when arriving at step 2
  useEffect(() => {
    if (step === 2 && !clientSecret && !creatingPaymentIntent && !bookingComplete) {
      setPolicyAcknowledged(true);
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

  const selectedAvailabilityTz = selectedSlot?.availabilityTimezone || "UTC";

  // Confirmation screen
  if (bookingComplete) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold">Booking Confirmed!</h2>
          <p className="mb-6 text-muted-foreground">
            Your {resolvedServiceName} with {diviner.display_name} has been
            booked.
          </p>

          {selectedSlot && (
            <div className="mb-6 rounded-lg border p-4 text-left">
              <p className="font-medium">{resolvedServiceName}</p>
              <p className="text-sm text-muted-foreground">
                {formatSlotDate(selectedSlot.start, clientTimezone)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatSlotTime(selectedSlot.start, clientTimezone)} -{" "}
                {formatSlotTime(selectedSlot.end, clientTimezone)} (
                {clientTimezone.replace(/_/g, " ")})
              </p>
              {selectedSlot.availabilityTitle && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Schedule: {selectedSlot.availabilityTitle}
                </p>
              )}
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
          <CardTitle>{STEPS[step]?.label ?? "Booking"}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Date & Time */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <CalendarPicker
                  divinerId={diviner.id}
                  serviceId={availabilityServiceId}
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
                      <p className="text-xs text-muted-foreground mb-3">
                        Times shown in{" "}
                        <span className="font-medium text-foreground">
                          {clientTimezone.replace(/_/g, " ")}
                        </span>
                        {" "}(your local time)
                      </p>

                      {selectedSlot?.availabilityTitle && (
                        <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4 text-left">
                          <p className="text-sm font-semibold text-foreground">
                            {selectedSlot.availabilityTitle}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {selectedSlot.availabilityStartTime} - {selectedSlot.availabilityEndTime}
                            {" • "}
                            {selectedAvailabilityTz.replace(/_/g, " ")}
                          </p>
                          {selectedSlot.availabilityDescription && (
                            <DescriptionHtml html={selectedSlot.availabilityDescription} />
                          )}
                          {selectedSlot.serviceName && (
                            <div className="mt-2 flex items-center justify-between rounded-md bg-background/50 px-3 py-2 border border-border/30">
                              <span className="text-xs text-muted-foreground">
                                Service: <span className="text-foreground font-medium">{selectedSlot.serviceName}</span>
                              </span>
                              {selectedSlot.servicePrice != null && selectedSlot.servicePrice > 0 && (
                                <span className="text-sm font-semibold text-foreground">
                                  {formatCurrency(selectedSlot.servicePrice)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {loadingSlots ? (
                        <div className="animate-pulse space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 rounded-lg bg-white/5" />
                          ))}
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No available times on this date. Try selecting a different day.
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
                serviceSlug={service.slug}
                serviceCategory={service.category}
                data={intakeData}
                onChange={setIntakeData}
              />

              {/* Notes & Special Requests */}
              <div className="mt-5 space-y-2">
                <label
                  htmlFor="bookingNotes"
                  className="block text-sm font-medium"
                >
                  Notes for your practitioner{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="bookingNotes"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={4}
                  maxLength={1000}
                  placeholder="Share anything that would help prepare for your session..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {bookingNotes.length}/1000
                </p>
              </div>
            </>
          )}

          {/* Step 3: Payment & Confirmation */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column — Booking Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>

                <div className="rounded-lg border p-4 space-y-3">
                  {!hideServiceName && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{resolvedServiceName}</span>
                      </div>
                      <Separator />
                    </>
                  )}
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
                          {formatSlotDate(selectedSlot.start, clientTimezone)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">
                          {formatSlotTime(selectedSlot.start, clientTimezone)} -{" "}
                          {formatSlotTime(selectedSlot.end, clientTimezone)}
                        </span>
                      </div>
                      {selectedSlot.availabilityTitle && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Schedule</span>
                            <span className="font-medium">
                              {selectedSlot.availabilityTitle}
                            </span>
                          </div>
                        </>
                      )}
                      {selectedSlot.availabilityTimezone && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Timezone</span>
                            <span className="font-medium">
                              {selectedSlot.availabilityTimezone.replace(/_/g, " ")}
                            </span>
                          </div>
                        </>
                      )}
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
                      {formatCurrency(effectivePrice)}
                    </span>
                  </div>
                </div>

                {/* Policy notice */}
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By proceeding with payment, you agree that{" "}
                    <strong className="text-foreground">50% of the payment is retained as a no-show fee</strong>{" "}
                    if you do not attend without prior notice, and that cancellations within 24 hours are non-refundable.
                  </p>
                </div>
              </div>

              {/* Right column — Payment Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment</h3>

                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    <p>{error}</p>
                    {!clientSecret && !creatingPaymentIntent && (
                      <button
                        type="button"
                        onClick={handleCreatePaymentIntent}
                        className="mt-2 underline hover:no-underline"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}

                {creatingPaymentIntent && (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
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
                      policyAcknowledged={policyAcknowledged}
                    />
                  </Elements>
                )}

                {!creatingPaymentIntent && !clientSecret && !error && (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
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
              setPolicyAcknowledged(false);
              // Release the slot hold so others can book
              fetch("/api/availability/hold", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionToken }),
              }).catch(() => {});
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
            onClick={async () => {
              // Validate intake form before advancing
              if (step === 1 && !canProceed()) {
                const missing: string[] = [];
                let firstMissingId = "";
                if (!intakeData.fullName.trim()) { missing.push("Full Name"); if (!firstMissingId) firstMissingId = "fullName"; }
                if (!intakeData.email.trim()) { missing.push("Email"); if (!firstMissingId) firstMissingId = "email"; }
                if (!intakeData.lifeArea) { missing.push("Life Area"); if (!firstMissingId) firstMissingId = "lifeArea"; }
                if (!intakeData.focusQuestion.trim()) { missing.push("Focus Question"); if (!firstMissingId) firstMissingId = "focusQuestion"; }
                toast.error(`Please fill in: ${missing.join(", ")}`);
                // Scroll to and focus the first missing field
                if (firstMissingId) {
                  const el = document.getElementById(firstMissingId);
                  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); }
                }
                return;
              }

              // When advancing from intake form (step 1)
              if (step === 1 && selectedSlot) {
                setCreatingPaymentIntent(true);

                // Place a hold on the slot
                try {
                  const res = await fetch("/api/availability/hold", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      divinerId: diviner.id,
                      scheduledAt: selectedSlot.start,
                      durationMinutes: service.duration_minutes,
                      sessionToken,
                    }),
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    toast.error(data.error ?? "This slot is no longer available. Please go back and choose a different time.");
                    setCreatingPaymentIntent(false);
                    return;
                  }
                } catch {
                  // Non-critical
                }

                // For free bookings ($0), skip payment step — book directly
                const isFree = isFreeBooking;
                if (isFree) {
                  setPolicyAcknowledged(true);
                  await handleCreatePaymentIntent();
                  return;
                }

                // Paid booking — advance to payment step
                setCreatingPaymentIntent(false);
                setStep((s) => s + 1);
                return;
              }

              setStep((s) => s + 1);
            }}
            disabled={(step === 0 && !canProceed()) || creatingPaymentIntent}
            className="gap-2"
          >
            {creatingPaymentIntent ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                {step === 1 && isFreeBooking
                  ? "Confirm Booking"
                  : "Next"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        )}

        {/* No "Proceed to Payment" button on step 2 -- the Stripe form handles it */}
      </div>
    </div>
  );
}
