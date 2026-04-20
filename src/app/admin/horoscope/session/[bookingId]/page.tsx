/**
 * /admin/horoscope/session/[bookingId]
 *
 * Diviner-facing single-tab horoscope page scoped to a specific booking.
 *
 * Responsibilities (server):
 *   - Auth via requireDivinerOrAdminForBooking (admins + assigned diviner only)
 *   - Resolve the booking's service_template → horoscope tab slug
 *   - Collect birth data from client row (preferred) OR questionnaire_responses
 *     fallback (early bookings stored it there)
 *   - Collect partner birth data from bookings.partner_birth_data for the
 *     3 two-person services
 *   - Pass a fully-formed initialForm to the client component. The client
 *     renders a single-tab UI, auto-fires the compute/AI pipeline, and
 *     displays the result — keeping the sprawling /admin/horoscope/page.tsx
 *     untouched per product decision 2026-04-18.
 */

import { notFound, redirect } from "next/navigation";
import {
  requireDivinerOrAdminForBooking,
  type BookingForSession,
} from "@/lib/require-diviner-or-admin-for-booking";
import {
  ASTROLOGY_TAB_MAP,
  isToolkitEnabled,
  requiresPartnerBirthData,
} from "@/lib/service-toolkit-mapping";
import { SingleHoroscopeSession } from "./single-horoscope-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Horoscope Session — AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

interface PrefillBirth {
  fullName: string;
  dob: string;   // YYYY-MM-DD
  tob: string;   // HH:MM
  city: {
    label: string;
    lat: number;
    lng: number;
    timezone: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Prefer the `clients` row for birth data; fall back to the booking's
 * questionnaire_responses JSONB (older bookings captured data there).
 */
function extractClientBirth(booking: BookingForSession): PrefillBirth {
  const client = booking.clients;
  const q = (booking.questionnaire_responses ?? {}) as Record<string, unknown>;

  const dob =
    (client?.birth_date ?? "").toString().slice(0, 10) ||
    str(q.birthDate).slice(0, 10);
  const tob =
    (client?.birth_time ?? "").toString().slice(0, 5) ||
    str(q.birthTime).slice(0, 5);
  const cityLabel = client?.birth_city || str(q.birthCity);
  const lat = num(client?.birth_lat) ?? num(q.birthLat as never);
  const lng = num(client?.birth_lng) ?? num(q.birthLng as never);
  const tz = client?.birth_timezone || str(q.birthTimezone);

  return {
    fullName: client?.full_name ?? "",
    dob,
    tob,
    city:
      cityLabel && lat !== null && lng !== null
        ? { label: cityLabel, lat, lng, timezone: tz || "UTC" }
        : null,
  };
}

function extractPartnerBirth(booking: BookingForSession): PrefillBirth | null {
  const p = booking.partner_birth_data as Record<string, unknown> | null;
  if (!p) return null;

  const dob = str(p.partner_birth_date).slice(0, 10);
  const tob = str(p.partner_birth_time).slice(0, 5);
  const cityLabel = str(p.partner_birth_city);
  const lat = num(p.partner_birth_lat as never);
  const lng = num(p.partner_birth_lng as never);
  const tz = str(p.partner_birth_timezone);

  return {
    fullName: str(p.partner_full_name),
    dob,
    tob,
    city:
      cityLabel && lat !== null && lng !== null
        ? { label: cityLabel, lat, lng, timezone: tz || "UTC" }
        : null,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HoroscopeSessionPage({ params }: PageProps) {
  const { bookingId } = await params;

  // Rollout gate — see service-toolkit-mapping.ts isToolkitEnabled().
  if (!isToolkitEnabled()) notFound();

  const { booking } = await requireDivinerOrAdminForBooking(bookingId);

  const template = booking.service_templates;
  if (!template || template.category !== "astrology") {
    redirect(`/admin/session/${bookingId}`);
  }

  const tabSlug = ASTROLOGY_TAB_MAP[template.slug];
  if (!tabSlug) {
    notFound();
  }

  const clientBirth = extractClientBirth(booking);
  const needsPartner = requiresPartnerBirthData(template.slug);
  const partnerBirth = needsPartner ? extractPartnerBirth(booking) : null;

  return (
    <SingleHoroscopeSession
      bookingId={booking.id}
      tabSlug={tabSlug}
      serviceName={template.name}
      scheduledAt={booking.scheduled_at}
      clientBirth={clientBirth}
      needsPartner={needsPartner}
      partnerBirth={partnerBirth}
    />
  );
}
