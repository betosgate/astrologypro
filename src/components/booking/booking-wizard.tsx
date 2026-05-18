"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPicker } from "./calendar-picker";
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
import { PRICING } from "@/lib/constants";
import { CitySearch, type CityResult } from "@/components/booking/city-search";
import { format } from "date-fns";
import { getServicePurchaseConfig } from "@/lib/service-purchase";
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
  intake_template_id?: string | null;
  product_kind?: string | null;
  is_subscription?: boolean | null;
  requires_birth_time?: boolean | null;
  requires_birth_city?: boolean | null;
  requires_partner_data?: boolean | null;
  pre_checkout_fields?: unknown;
  post_checkout_fields?: unknown;
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
  /**
   * Optional `service_template_intake_submissions` id — set by the shared
   * `/book/template/[slug]` flow so the final booking row keeps a link
   * back to the saved intake. Forwarded to the booking-payment POST,
   * which persists it in `bookings.metadata.intake_submission_id`.
   */
  submissionId?: string | null;
  /**
   * Optional sanitized values from a service template intake submission.
   * Used only to prefill empty Contact-step fields; user edits still win.
   */
  intakePrefill?: Partial<
    Pick<
      BookingDetails,
      | "birthDate"
      | "birthTime"
      | "birthCity"
      | "birthLat"
      | "birthLng"
      | "birthTimezone"
      | "notes"
    >
  > | null;
  /**
   * Optional preselected date (YYYY-MM-DD) carried from the shared
   * calendar flow so the wizard opens on the correct month. Purely a
   * UX hint — does not skip slot selection.
   */
  preselectedDate?: string | null;
  /**
   * Server-derived deep-link hint. Keeps SSR and the first client render in
   * sync when the URL already includes a selected date + time.
   */
  startOnContact?: boolean;
  /**
   * Optional Perennial community member discount token. Forwarded to
   * booking-payment, which validates and consumes it server-side.
   */
  discountToken?: string | null;
}

const STEPS = [
  { label: "Date & Time", icon: Calendar },
  { label: "Contact", icon: CreditCard },
  { label: "Confirm & Pay", icon: CheckCircle },
];

interface BookingDetails {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: string;
  notes: string;
}

const INITIAL_DETAILS: BookingDetails = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  birthTime: "",
  birthCity: "",
  birthLat: null,
  birthLng: null,
  birthTimezone: "",
  notes: "",
};

type MemberDiscountState =
  | { status: "idle" | "checking" | "invalid"; percent: null }
  | { status: "valid"; percent: number };

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${encodeURIComponent(name)}=`;
  const row = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : undefined;
}

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
  bookingId,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  policyAcknowledged: boolean;
  bookingId?: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    onError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
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
      // Notify the backend as a webhook fallback — verify payment and update
      // booking/order status so they don't stay stuck in pending_payment.
      if (paymentIntent?.id && bookingId) {
        fetch("/api/stripe/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bookingId,
          }),
        }).catch(() => {
          // Non-critical — webhook will handle it if this fails
        });
      }
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
  submissionId = null,
  intakePrefill = null,
  preselectedDate = null,
  startOnContact = false,
  discountToken = null,
}: BookingWizardProps) {
  // Start on the Contact step when the URL already carries a chosen date + time
  // (deep-link from the profile's "Next Available" picker) so users don't see a
  // flash of the calendar while slots load. We fall back to step 0 if the
  // requested time turns out to be unavailable.
  const [step, setStep] = useState(() => (startOnContact ? 1 : 0));
  // Seed from the optional preselectedDate hint (shared `/book/template/[slug]`
  // flow). Strictly a UX nudge so the calendar opens on the right month — the
  // user still has to pick a slot.
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (!preselectedDate) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preselectedDate)) return undefined;
    const [y, m, d] = preselectedDate.split("-").map(Number);
    // Use noon local time so timezone DST edges don't flip the calendar day.
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return Number.isNaN(date.getTime()) ? undefined : date;
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>(INITIAL_DETAILS);
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
  const [bookingToken, setBookingToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [requiresPostPaymentIntake, setRequiresPostPaymentIntake] = useState(
    getServicePurchaseConfig(service).requiresPostPaymentIntake
  );
  const [error, setError] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [memberDiscount, setMemberDiscount] = useState<MemberDiscountState>({
    status: discountToken ? "checking" : "idle",
    percent: null,
  });
  const [requestedTimeIso, setRequestedTimeIso] = useState<string | null>(null);
  const [hasAutoAdvancedFromQuery, setHasAutoAdvancedFromQuery] =
    useState(startOnContact);
  const [clientTimezone, setClientTimezone] = useState(diviner.timezone || "UTC");
  const resolvedServiceName = hideServiceName ? (bookingLabel ?? "Reading Session") : (bookingLabel ?? service.name);
  const availabilityQuery = availabilityServiceId ? `&serviceId=${availabilityServiceId}` : "";

  useEffect(() => {
    if (!intakePrefill) return;

    setBookingDetails((prev) => ({
      ...prev,
      birthDate: prev.birthDate || intakePrefill.birthDate || "",
      birthTime: prev.birthTime || intakePrefill.birthTime || "",
      birthCity: prev.birthCity || intakePrefill.birthCity || "",
      birthLat:
        prev.birthLat != null ? prev.birthLat : (intakePrefill.birthLat ?? null),
      birthLng:
        prev.birthLng != null ? prev.birthLng : (intakePrefill.birthLng ?? null),
      birthTimezone:
        prev.birthTimezone || intakePrefill.birthTimezone || "",
      notes: prev.notes || intakePrefill.notes || "",
    }));
    setPrefilled(true);
  }, [intakePrefill]);

  // Effective price: slot's linked service price takes priority over the service prop's base_price.
  // If the slot has NO linked service (availabilityServiceId is null), it is an unscoped
  // calendar slot — treat as free regardless of the service's base_price.
  const slotIsUnscoped = selectedSlot != null && selectedSlot.availabilityServiceId == null;
  const effectivePrice = slotIsUnscoped
    ? 0
    : selectedSlot?.servicePrice != null
      ? selectedSlot.servicePrice
      : Number(service.base_price ?? service.price ?? 0);
  const isFreeBooking = effectivePrice <= 0;
  const memberDiscountPercent =
    memberDiscount.status === "valid" ? memberDiscount.percent : null;
  const basePlatformFeePercent = PRICING.platformFeePercent;
  const discountedPlatformFeePercent =
    memberDiscountPercent != null
      ? Math.max(basePlatformFeePercent - memberDiscountPercent, 10)
      : basePlatformFeePercent;
  const standardPlatformFee = Math.round(effectivePrice * (basePlatformFeePercent / 100) * 100) / 100;
  const discountedPlatformFee = Math.round(effectivePrice * (discountedPlatformFeePercent / 100) * 100) / 100;
  const memberPlatformFeeSavings = Math.max(
    0,
    Math.round((standardPlatformFee - discountedPlatformFee) * 100) / 100
  );
  const discountedTotal = Math.max(
    0,
    Math.round((effectivePrice - memberPlatformFeeSavings) * 100) / 100
  );

  useEffect(() => {
    if (!discountToken) {
      setMemberDiscount({ status: "idle", percent: null });
      return;
    }

    let cancelled = false;
    setMemberDiscount({ status: "checking", percent: null });

    fetch(`/api/community/discount-token/validate?token=${encodeURIComponent(discountToken)}`)
      .then((res) => res.json())
      .then((data: { valid?: boolean; discount_percent?: number }) => {
        if (cancelled) return;
        if (data.valid && typeof data.discount_percent === "number") {
          setMemberDiscount({ status: "valid", percent: data.discount_percent });
        } else {
          setMemberDiscount({ status: "invalid", percent: null });
        }
      })
      .catch(() => {
        if (!cancelled) setMemberDiscount({ status: "invalid", percent: null });
      });

    return () => {
      cancelled = true;
    };
  }, [discountToken]);

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

        setBookingDetails((prev) => ({
          ...prev,
          fullName: client.full_name || prev.fullName,
          email: client.email || user.email || prev.email,
          phone: client.phone || prev.phone,
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

    // Jump to the Contact step immediately on a deep-link, before the slots API
    // resolves. Without this, SSR renders step 0 and the user sees the calendar
    // flash while the fetch (2-3s) settles.
    if (date && time) {
      setStep((s) => (s === 0 ? 1 : s));
      setHasAutoAdvancedFromQuery(true);
    }
  }, []);

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
            const requestedTs = new Date(pendingTimeIso).getTime();
            const requestedSlot = slots.find((slot) => {
              if (slot.start === pendingTimeIso) return true;
              const slotTs = new Date(slot.start).getTime();
              return Number.isFinite(slotTs) && Number.isFinite(requestedTs) && slotTs === requestedTs;
            });
            if (requestedSlot) {
              setSelectedSlot(requestedSlot);
            } else {
              // No exact match in the fetched set — fall back to a synthetic slot
              // built from the deep-link URL so the user stays on Contact instead
              // of getting bounced back to the calendar. Server-side validation
              // at submit time is authoritative anyway.
              const start = pendingTimeIso;
              const endMs = new Date(start).getTime() + service.duration_minutes * 60_000;
              const end = Number.isFinite(endMs) ? new Date(endMs).toISOString() : start;
              setSelectedSlot({
                start,
                end,
                availabilityServiceId: availabilityServiceId ?? null,
              });
            }
            if (!hasAutoAdvancedFromQuery) {
              setStep(1);
              setHasAutoAdvancedFromQuery(true);
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
      case 1: {
        const phoneClean = bookingDetails.phone?.replace(/[\s()-]/g, "") ?? "";
        const phoneValid = /^\+\d{7,15}$/.test(phoneClean);
        return !!(
          selectedSlot &&
          bookingDetails.fullName.trim() &&
          bookingDetails.email.trim() &&
          bookingDetails.phone.trim() &&
          phoneValid &&
          bookingDetails.notes.trim() &&
          (!(service.requires_birth_data || service.requires_birth_time || service.requires_birth_city) || bookingDetails.birthDate) &&
          (!(service.requires_birth_data || service.requires_birth_time || service.requires_birth_city) || (bookingDetails.birthCity.trim() && bookingDetails.birthLat != null))
        );
      }
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
      // Spec §3.8 step 1: URL ?ref= wins (last-touch via fresh click);
      // fall back to aff_ref cookie set at /r/<code> for organic returns.
      const urlParams = new URLSearchParams(window.location.search);
      const refFromUrl = urlParams.get("ref") || undefined;
      const refFromCookie = readCookie("aff_ref");
      const refCode = refFromUrl ?? refFromCookie ?? undefined;

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
          clientEmail: bookingDetails.email,
          clientName: bookingDetails.fullName,
          clientPhone: bookingDetails.phone || undefined,
          booking_notes: bookingDetails.notes || undefined,
          questionnaire: {
            ...(bookingDetails.birthDate ? { birthDate: bookingDetails.birthDate } : {}),
            ...(bookingDetails.birthTime ? { birthTime: bookingDetails.birthTime } : {}),
            ...(bookingDetails.birthCity ? { birthCity: bookingDetails.birthCity } : {}),
            ...(bookingDetails.birthLat != null ? { birthLat: bookingDetails.birthLat } : {}),
            ...(bookingDetails.birthLng != null ? { birthLng: bookingDetails.birthLng } : {}),
            ...(bookingDetails.birthTimezone ? { birthTimezone: bookingDetails.birthTimezone } : {}),
          },
          refCode,
          discount_token: discountToken ?? undefined,
          policyAcknowledgedAt: policyAcknowledged ? new Date().toISOString() : undefined,
          // Signal that this slot is not linked to any service — the API will skip charging.
          freeSlot: slotIsUnscoped ? true : undefined,
          // Shared-calendar flow carries the saved intake id so the booking
          // row keeps the link (persisted to bookings.metadata.intake_submission_id).
          submissionId: submissionId ?? undefined,
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
        if (data.bookingToken) {
          setBookingToken(data.bookingToken);
        }
        if (data.orderId) {
          setOrderId(data.orderId);
        }
        setRequiresPostPaymentIntake(Boolean(data.requiresPostPaymentIntake));
      } else if (data.bookingId) {
        setBookingId(data.bookingId);
        if (data.bookingToken) {
          setBookingToken(data.bookingToken);
        }
        if (data.orderId) {
          setOrderId(data.orderId);
        }
        setRequiresPostPaymentIntake(Boolean(data.requiresPostPaymentIntake));
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

  const sessionJoinUrl = bookingId && bookingToken
    ? `/${diviner.username}/session/${bookingId}?token=${bookingToken}`
    : bookingId
    ? `/${diviner.username}/session/${bookingId}`
    : null;
  const portalOrderUrl = orderId ? `/portal/orders/${orderId}` : null;
  const portalSignInUrl = portalOrderUrl
    ? `/login?redirect=${encodeURIComponent(portalOrderUrl)}`
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
              className="mb-4 w-full gap-2"
              size="lg"
              variant={requiresPostPaymentIntake ? "outline" : "default"}
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
            const label = i === 2 && isFreeBooking ? "Confirm" : s.label;
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
                  <span className="hidden sm:inline">{label}</span>
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
          <CardTitle>{step === 2 && isFreeBooking ? "Confirm Booking" : (STEPS[step]?.label ?? "Booking")}</CardTitle>
        </CardHeader>
        <CardContent>
          {discountToken && memberDiscount.status !== "idle" && (
            <div
              className={cn(
                "mb-6 rounded-lg border px-4 py-3 text-sm",
                memberDiscount.status === "valid"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : memberDiscount.status === "checking"
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-destructive/25 bg-destructive/10 text-destructive"
              )}
            >
              {memberDiscount.status === "valid" && (
                <span>
                  Community member benefit active: {memberDiscount.percent}% off
                  the platform-fee portion of this booking.
                </span>
              )}
              {memberDiscount.status === "checking" && (
                <span>Checking your Community member discount...</span>
              )}
              {memberDiscount.status === "invalid" && (
                <span>
                  This Community discount token is expired or already used. The
                  standard booking price will apply.
                </span>
              )}
            </div>
          )}

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
            <div className="space-y-6">
              {prefilled && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                  Your details are pre-filled where available. Feel free to
                  update anything before continuing.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-full-name">Full Name</Label>
                  <Input
                    id="booking-full-name"
                    value={bookingDetails.fullName}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-email">Email</Label>
                  <Input
                    id="booking-email"
                    type="email"
                    value={bookingDetails.email}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="booking-phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="booking-phone"
                    type="tel"
                    value={bookingDetails.phone}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+1 555 123 4567"
                    autoComplete="tel"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure this is correct — your session call will be connected to this number. A wrong number means the call won&apos;t go through.
                  </p>
                  {bookingDetails.phone && !/^\+\d{1,3}\s?\d{6,14}$/.test(bookingDetails.phone.replace(/[\s()-]/g, "").replace(/^(\+\d{1,3})/, "$1")) && (
                    <p className="text-xs text-destructive">
                      Please enter a valid phone number starting with country code (e.g. +1 or +91)
                    </p>
                  )}
                </div>
              </div>

              {/* Birth data — shown when the service requires it */}
              {(service.requires_birth_data || service.requires_birth_time || service.requires_birth_city) && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Birth Information</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="booking-birth-date">
                        Date of Birth <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="booking-birth-date"
                        type="date"
                        value={bookingDetails.birthDate}
                        onChange={(e) =>
                          setBookingDetails((prev) => ({
                            ...prev,
                            birthDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {service.requires_birth_time && (
                      <div className="space-y-2">
                        <Label htmlFor="booking-birth-time">
                          Time of Birth <span className="text-muted-foreground text-xs">(if known)</span>
                        </Label>
                        <Input
                          id="booking-birth-time"
                          type="time"
                          value={bookingDetails.birthTime}
                          onChange={(e) =>
                            setBookingDetails((prev) => ({
                              ...prev,
                              birthTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="booking-birth-city">
                        Place of Birth <span className="text-destructive">*</span>
                      </Label>
                      <CitySearch
                        id="booking-birth-city"
                        value={bookingDetails.birthCity}
                        placeholder="Search city, e.g. Mumbai, India"
                        onChange={(result: CityResult) =>
                          setBookingDetails((prev) => ({
                            ...prev,
                            birthCity: result.city,
                            birthLat: result.lat,
                            birthLng: result.lng,
                            birthTimezone: result.timezone,
                          }))
                        }
                        onTextChange={(text) =>
                          setBookingDetails((prev) => ({
                            ...prev,
                            birthCity: text,
                            // Clear lat/lng when user types manually (force re-selection)
                            birthLat: null,
                            birthLng: null,
                            birthTimezone: "",
                          }))
                        }
                      />
                      {bookingDetails.birthCity && bookingDetails.birthLat != null && (
                        <p className="text-xs text-amber-500/80">
                          {bookingDetails.birthCity} — {bookingDetails.birthLat.toFixed(4)}°, {bookingDetails.birthLng?.toFixed(4)}° ({bookingDetails.birthTimezone})
                        </p>
                      )}
                      {bookingDetails.birthCity && bookingDetails.birthLat == null && (
                        <p className="text-xs text-destructive">
                          Please select a location from the dropdown
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes — required */}
              <div className="space-y-2">
                <Label htmlFor="booking-notes">
                  Notes <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="booking-notes"
                  rows={3}
                  value={bookingDetails.notes}
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Anything you'd like the practitioner to know before your session…"
                  required
                />
              </div>

            </div>
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
                    <span className="font-medium">{bookingDetails.fullName}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reading price</span>
                    <span className="font-medium">
                      {formatCurrency(effectivePrice)}
                    </span>
                  </div>
                  {memberDiscountPercent != null && !isFreeBooking && (
                    <>
                      <Separator />
                      <div className="space-y-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">
                            Community member benefit
                          </span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            -{memberDiscountPercent}% platform fee
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Standard platform fee</span>
                          <span>
                            {basePlatformFeePercent}% ({formatCurrency(standardPlatformFee)})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Member platform fee</span>
                          <span>
                            {discountedPlatformFeePercent}% ({formatCurrency(discountedPlatformFee)})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <span>Community member discount</span>
                          <span>-{formatCurrency(memberPlatformFeeSavings)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">
                      {formatCurrency(discountedTotal)}
                    </span>
                  </div>
                </div>

                {/* Policy notice */}
                {isFreeBooking && (
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This is a <strong className="text-foreground">free appointment</strong>. No payment is required. Please be on time — out of respect for the diviner&apos;s schedule.
                    </p>
                  </div>
                )}
              </div>

              {/* Right column — Payment Form (hidden for free/unscoped bookings) */}
              <div className="space-y-4">
                {!isFreeBooking && <h3 className="text-lg font-semibold">Payment</h3>}

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
                      bookingId={bookingId}
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
                if (!bookingDetails.fullName.trim()) { missing.push("Full Name"); if (!firstMissingId) firstMissingId = "booking-full-name"; }
                if (!bookingDetails.email.trim()) { missing.push("Email"); if (!firstMissingId) firstMissingId = "booking-email"; }
                if (!bookingDetails.phone.trim()) { missing.push("Phone Number"); if (!firstMissingId) firstMissingId = "booking-phone"; }
                else {
                  const pc = bookingDetails.phone.replace(/[\s()-]/g, "");
                  if (!/^\+\d{7,15}$/.test(pc)) { missing.push("Valid Phone (e.g. +1... or +91...)"); if (!firstMissingId) firstMissingId = "booking-phone"; }
                }
                const needsBirthData = service.requires_birth_data || service.requires_birth_time || service.requires_birth_city;
                if (needsBirthData && !bookingDetails.birthDate) { missing.push("Date of Birth"); if (!firstMissingId) firstMissingId = "booking-birth-date"; }
                if (needsBirthData && !bookingDetails.birthCity.trim()) { missing.push("Place of Birth"); if (!firstMissingId) firstMissingId = "booking-birth-city"; }
                else if (needsBirthData && bookingDetails.birthLat == null) { missing.push("Place of Birth (select from dropdown)"); if (!firstMissingId) firstMissingId = "booking-birth-city"; }
                if (!bookingDetails.notes.trim()) { missing.push("Notes"); if (!firstMissingId) firstMissingId = "booking-notes"; }
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
