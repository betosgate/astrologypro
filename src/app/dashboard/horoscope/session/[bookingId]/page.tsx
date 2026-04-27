/**
 * /dashboard/horoscope/session/[bookingId]
 *
 * Diviner-facing booking-scoped horoscope route. It performs the same
 * ownership and template checks as the admin route, then redirects into the
 * dashboard-hosted horoscope toolkit with a prefilled form.
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

export const dynamic = "force-dynamic";
export const metadata = { title: "Horoscope Session - AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

interface PrefillCity {
  label: string;
  lat: number;
  lng: number;
  timezone: { name: string; offset_string: string; utcOffset: string };
}
interface PrefillBirth {
  dob: string;
  tob: string;
  city: PrefillCity | null;
}
interface PrefillForm {
  person1: PrefillBirth;
  person2: PrefillBirth;
  areaOfInquiry: string;
  question: string;
  futureWeek: string;
  futureMonth: string;
}

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const NOON_DEFAULT_TOB = "12:00";

function emptyBirth(): PrefillBirth {
  return { dob: "", tob: "", city: null };
}

function asPrefillBirth(
  dob: string,
  tob: string,
  cityLabel: string,
  lat: number | null,
  lng: number | null,
  tz: string,
): PrefillBirth {
  return {
    dob,
    tob: tob && tob.trim() ? tob : NOON_DEFAULT_TOB,
    city:
      cityLabel && lat !== null && lng !== null
        ? {
            label: cityLabel,
            lat,
            lng,
            timezone: {
              name: tz || "UTC",
              offset_string: "",
              utcOffset: "",
            },
          }
        : null,
  };
}

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

  return asPrefillBirth(dob, tob, cityLabel, lat, lng, tz);
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

  if (!dob && !cityLabel) return null;
  return asPrefillBirth(dob, tob, cityLabel, lat, lng, tz);
}

export default async function DashboardHoroscopeSessionPage({
  params,
}: PageProps) {
  const { bookingId } = await params;

  if (!isToolkitEnabled()) notFound();

  const { booking } = await requireDivinerOrAdminForBooking(bookingId);

  const template = booking.service_templates;
  if (!template || template.category !== "astrology") {
    redirect(`/service/session/${bookingId}`);
  }

  const tabSlug = ASTROLOGY_TAB_MAP[template.slug];
  if (!tabSlug) notFound();

  const clientBirth = extractClientBirth(booking);
  const needsPartner = requiresPartnerBirthData(template.slug);
  const partnerBirth = needsPartner ? extractPartnerBirth(booking) : null;

  const prefill: PrefillForm = {
    person1: clientBirth,
    person2: partnerBirth ?? emptyBirth(),
    areaOfInquiry: "",
    question: "",
    futureWeek: "",
    futureMonth: "",
  };

  const encoded = encodeURIComponent(JSON.stringify(prefill));
  redirect(`/service/horoscope?tab=${tabSlug}&prefill=${encoded}`);
}
