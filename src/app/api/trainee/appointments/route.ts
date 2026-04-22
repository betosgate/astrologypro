/**
 * GET /api/trainee/appointments
 *
 * Returns the authenticated trainee's booked appointments by matching
 * the authenticated user's email against stored client email fields.
 *
 * Supports both:
 * - legacy `bookings` rows linked through `clients.email`
 * - newer `admin_bookings` rows stored with `client_email`
 *
 * Authentication: supabase.auth.getUser() — same pattern as the rest
 * of the codebase. The email is read from the auth record, NEVER from
 * a client-supplied field.
 *
 * Response: { ok: true, data: [{ id, status, scheduled_at, ... }] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface MatchedClient {
  id: string;
  email: string;
  full_name: string | null;
}

interface LegacyBookingRow {
  id: string;
  diviner_id: string | null;
  owner_id?: string | null;
  client_id: string | null;
  service_id: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  base_price: number | null;
  total_amount: number | null;
  booking_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  services:
    | {
        id: string;
        name: string;
        slug: string | null;
        duration_minutes: number | null;
        template_id: string | null;
      }
    | Array<{
        id: string;
        name: string;
        slug: string | null;
        duration_minutes: number | null;
        template_id: string | null;
      }>
    | null;
  clients: MatchedClient | MatchedClient[] | null;
  diviners:
    | { username: string | null }
    | Array<{ username: string | null }>
    | null;
}

interface AdminBookingRow {
  id: string;
  admin_user_id: string;
  client_name: string;
  client_email: string;
  client_note: string | null;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string | null;
  status: string;
  created_at: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "No email on authenticated user" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve the matching client rows first so the response can include
  // the canonical client record data even when the appointment came
  // from the newer admin_bookings flow.
  const { data: clientRows } = await admin
    .from("clients")
    .select("id, email, full_name")
    .ilike("email", email);
  const matchedClients = ((clientRows ?? []) as MatchedClient[]).map((client) => ({
    id: client.id,
    email: client.email,
    full_name: client.full_name ?? null,
  }));
  const clientIds = matchedClients.map((client) => client.id);

  let bookings: LegacyBookingRow[] = [];
  if (clientIds.length > 0) {
    const { data } = await admin
      .from("bookings")
      .select(
        `id, diviner_id, owner_id, client_id, service_id, scheduled_at, duration_minutes,
         status, base_price, total_amount, booking_notes, metadata, created_at,
         services:service_id ( id, name, slug, duration_minutes, template_id ),
         clients:client_id ( id, email, full_name ),
         diviners:diviner_id ( username )`
      )
      .in("client_id", clientIds)
      .order("scheduled_at", { ascending: false });
    bookings = (data ?? []) as LegacyBookingRow[];
  }

  // Backfill diviner usernames for any bookings where the embed returned
  // nothing — happens when the diviner_id → owner_id rename leaves some rows
  // with owner_id populated and diviner_id null, so the embed join yields
  // nothing. Without this, booking.username is undefined on the client and
  // the drawer falls back to the inline datetime form instead of the
  // calendar reschedule page.
  const divinerUsernameById = new Map<string, string>();
  const missingDivinerIds = new Set<string>();
  for (const row of bookings) {
    const embedded = Array.isArray(row.diviners)
      ? row.diviners[0] ?? null
      : row.diviners;
    if (embedded?.username) {
      if (row.diviner_id) divinerUsernameById.set(row.diviner_id, embedded.username);
      if (row.owner_id) divinerUsernameById.set(row.owner_id, embedded.username);
      continue;
    }
    const fallbackKey = row.diviner_id ?? row.owner_id ?? null;
    if (fallbackKey && !divinerUsernameById.has(fallbackKey)) {
      missingDivinerIds.add(fallbackKey);
    }
  }
  if (missingDivinerIds.size > 0) {
    const { data: divinerRows } = await admin
      .from("diviners")
      .select("id, username")
      .in("id", Array.from(missingDivinerIds));
    for (const row of divinerRows ?? []) {
      if (row.username) divinerUsernameById.set(row.id as string, row.username as string);
    }
  }

  const { data: adminBookingRows, error: adminBookingsError } = await admin
    .from("admin_bookings")
    .select(
      "id, admin_user_id, client_name, client_email, client_note, scheduled_at, duration_minutes, timezone, status, created_at"
    )
    .ilike("client_email", email)
    .order("scheduled_at", { ascending: false });

  // Resolve admin usernames so trainees can deep-link to the calendar
  // reschedule page at `/book/<admin-username>/reschedule/<booking-id>`.
  const adminUserIds = new Set<string>();
  for (const row of adminBookingRows ?? []) {
    if (row.admin_user_id) adminUserIds.add(row.admin_user_id as string);
  }
  const adminUsernameByUserId = new Map<string, string>();
  if (adminUserIds.size > 0) {
    const { data: adminUserRows } = await admin
      .from("admin_users")
      .select("user_id, username")
      .in("user_id", Array.from(adminUserIds));
    for (const row of adminUserRows ?? []) {
      if (row.user_id && row.username) {
        adminUsernameByUserId.set(row.user_id as string, row.username as string);
      }
    }
  }

  const adminBookingsMissing =
    !!adminBookingsError &&
    adminBookingsError.message.toLowerCase().includes("admin_bookings");
  const adminBookings = adminBookingsMissing
    ? []
    : ((adminBookingRows ?? []) as AdminBookingRow[]);

  const normalizedLegacy = bookings.map((booking) => {
    const service = Array.isArray(booking.services)
      ? booking.services[0] ?? null
      : booking.services;
    const client = Array.isArray(booking.clients)
      ? booking.clients[0] ?? null
      : booking.clients;
    const diviner = Array.isArray(booking.diviners)
      ? booking.diviners[0] ?? null
      : booking.diviners;
    const resolvedUsername =
      diviner?.username ??
      (booking.diviner_id
        ? divinerUsernameById.get(booking.diviner_id) ?? null
        : null) ??
      (booking.owner_id
        ? divinerUsernameById.get(booking.owner_id) ?? null
        : null);

    const rescheduleHref = resolvedUsername
      ? `/${resolvedUsername}/reschedule/${booking.id}`
      : null;
    const joinHref = resolvedUsername
      ? `/${resolvedUsername}/session/${booking.id}`
      : null;

    return {
      id: booking.id,
      source: "bookings" as const,
      status: booking.status,
      scheduled_at: booking.scheduled_at,
      duration_minutes: Number(booking.duration_minutes ?? 0),
      diviner_id: booking.diviner_id ?? null,
      diviner_username: resolvedUsername,
      reschedule_href: rescheduleHref,
      join_href: joinHref,
      service_id: booking.service_id ?? null,
      service_name: service?.name ?? null,
      client_id: booking.client_id ?? null,
      client_name: client?.full_name ?? null,
      client_email: client?.email ?? email,
      client: client
        ? {
            id: client.id,
            email: client.email,
            full_name: client.full_name ?? null,
          }
        : null,
      base_price: Number(booking.base_price ?? 0),
      total_amount: Number(booking.total_amount ?? 0),
      booking_notes: booking.booking_notes ?? null,
      metadata: booking.metadata ?? null,
      created_at: booking.created_at,
    };
  });

  const normalizedAdmin = adminBookings.map((booking) => {
    const matchedClient =
      matchedClients.find(
        (client) => client.email.trim().toLowerCase() === email
      ) ?? null;

    const adminUsername =
      booking.admin_user_id
        ? adminUsernameByUserId.get(booking.admin_user_id as string) ?? null
        : null;
    const rescheduleHref = adminUsername
      ? `/book/${adminUsername}/reschedule/${booking.id}`
      : null;
    const joinHref = adminUsername
      ? `/book/${adminUsername}/session/${booking.id}`
      : null;

    return {
      id: booking.id,
      source: "admin_bookings" as const,
      status: booking.status,
      scheduled_at: booking.scheduled_at,
      duration_minutes: Number(booking.duration_minutes ?? 0),
      diviner_id: booking.admin_user_id ?? null,
      diviner_username: adminUsername,
      reschedule_href: rescheduleHref,
      join_href: joinHref,
      service_id: null,
      service_name: "Appointment",
      client_id: matchedClient?.id ?? null,
      client_name: booking.client_name ?? matchedClient?.full_name ?? null,
      client_email: booking.client_email ?? matchedClient?.email ?? email,
      client: matchedClient
        ? {
            id: matchedClient.id,
            email: matchedClient.email,
            full_name: matchedClient.full_name ?? null,
          }
        : null,
      base_price: 0,
      total_amount: 0,
      booking_notes: booking.client_note ?? null,
      metadata: {
        source_table: "admin_bookings",
        timezone: booking.timezone ?? null,
      },
      created_at: booking.created_at,
    };
  });

  const data = [...normalizedLegacy, ...normalizedAdmin].sort(
    (a, b) =>
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  );

  return NextResponse.json({
    ok: true,
    email,
    matched_clients: matchedClients,
    data,
  });
}
