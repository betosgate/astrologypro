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

interface BookingRow {
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
  booking_token: string | null;
  created_at: string;
  services:
    | {
        id: string;
        name: string;
        slug: string | null;
        duration_minutes: number | null;
      }
    | Array<{
        id: string;
        name: string;
        slug: string | null;
        duration_minutes: number | null;
      }>
    | null;
  clients: MatchedClient | MatchedClient[] | null;
  diviners:
    | {
        id?: string | null;
        username: string | null;
        display_name: string | null;
      }
    | Array<{
        id?: string | null;
        username: string | null;
        display_name: string | null;
      }>
    | null;
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

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { ok: false, error: "Community membership not found" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

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

  let bookings: BookingRow[] = [];
  if (clientIds.length > 0) {
    const { data, error } = await admin
      .from("bookings")
      .select(
        `id, diviner_id, owner_id, client_id, service_id, scheduled_at,
         duration_minutes, status, base_price, total_amount, booking_notes,
         metadata, booking_token, created_at,
         services:service_id ( id, name, slug, duration_minutes ),
         clients:client_id ( id, email, full_name ),
         diviners:diviner_id ( id, username, display_name )`
      )
      .in("client_id", clientIds)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("[community/bookings] booking lookup failed:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to load bookings" },
        { status: 500 }
      );
    }

    bookings = (data ?? []) as BookingRow[];
  }

  const divinerById = new Map<
    string,
    { username: string | null; display_name: string | null }
  >();
  const missingDivinerIds = new Set<string>();

  for (const booking of bookings) {
    const embedded = Array.isArray(booking.diviners)
      ? booking.diviners[0] ?? null
      : booking.diviners;

    if (embedded?.username || embedded?.display_name) {
      if (booking.diviner_id) {
        divinerById.set(booking.diviner_id, {
          username: embedded.username ?? null,
          display_name: embedded.display_name ?? null,
        });
      }
      if (booking.owner_id) {
        divinerById.set(booking.owner_id, {
          username: embedded.username ?? null,
          display_name: embedded.display_name ?? null,
        });
      }
      continue;
    }

    const fallbackId = booking.diviner_id ?? booking.owner_id ?? null;
    if (fallbackId && !divinerById.has(fallbackId)) {
      missingDivinerIds.add(fallbackId);
    }
  }

  if (missingDivinerIds.size > 0) {
    const { data: divinerRows } = await admin
      .from("diviners")
      .select("id, username, display_name")
      .in("id", Array.from(missingDivinerIds));

    for (const row of divinerRows ?? []) {
      divinerById.set(row.id as string, {
        username: (row.username as string | null) ?? null,
        display_name: (row.display_name as string | null) ?? null,
      });
    }
  }

  const data = bookings.map((booking) => {
    const service = Array.isArray(booking.services)
      ? booking.services[0] ?? null
      : booking.services;
    const client = Array.isArray(booking.clients)
      ? booking.clients[0] ?? null
      : booking.clients;
    const embeddedDiviner = Array.isArray(booking.diviners)
      ? booking.diviners[0] ?? null
      : booking.diviners;
    const fallbackDiviner =
      (booking.diviner_id ? divinerById.get(booking.diviner_id) : null) ??
      (booking.owner_id ? divinerById.get(booking.owner_id) : null) ??
      null;

    const divinerUsername =
      embeddedDiviner?.username ?? fallbackDiviner?.username ?? null;
    const divinerName =
      embeddedDiviner?.display_name ??
      fallbackDiviner?.display_name ??
      divinerUsername ??
      "Your diviner";
    const title = service?.name ?? "Reading";
    const joinHref = divinerUsername
      ? booking.booking_token
        ? `/${divinerUsername}/session/${booking.id}?token=${encodeURIComponent(
            booking.booking_token
          )}`
        : `/${divinerUsername}/session/${booking.id}`
      : null;

    return {
      id: booking.id,
      source: "bookings" as const,
      title,
      diviner_name: divinerName,
      diviner_username: divinerUsername,
      scheduled_at: booking.scheduled_at,
      duration_minutes: Number(
        booking.duration_minutes ?? service?.duration_minutes ?? 0
      ),
      status: booking.status,
      join_href: joinHref,
      reschedule_href: null,
      service_id: booking.service_id ?? null,
      service_name: title,
      client_id: booking.client_id ?? null,
      client_name: client?.full_name ?? null,
      client_email: client?.email ?? email,
      base_price: Number(booking.base_price ?? 0),
      total_amount: Number(booking.total_amount ?? booking.base_price ?? 0),
      booking_notes: booking.booking_notes ?? null,
      metadata: booking.metadata ?? null,
      created_at: booking.created_at,
    };
  });

  return NextResponse.json({
    ok: true,
    email,
    matched_clients: matchedClients.length,
    data,
  });
}

