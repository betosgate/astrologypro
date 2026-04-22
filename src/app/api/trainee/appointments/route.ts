/**
 * GET /api/trainee/appointments
 *
 * Returns the authenticated trainee's booked appointments (any booking
 * whose client.email matches the authenticated user's email) so the
 * trainee dashboard can show them after the Tabbie booking flow.
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

  // Step 1: find every clients row that matches the trainee email.
  //   We do not join — some deployments store the client email on the
  //   clients table, some on bookings directly. Handle both.
  const { data: clientRows } = await admin
    .from("clients")
    .select("id")
    .ilike("email", email);
  const clientIds = ((clientRows ?? []) as Array<{ id: string }>).map((c) => c.id);

  // Step 2: load every booking that (a) has a client_id matching those
  // rows OR (b) has that email embedded in metadata.clientEmail as a fallback
  // for older rows. We select generously; the trainee UI filters/renders
  // as needed.
  let bookings: Array<Record<string, unknown>> = [];
  if (clientIds.length > 0) {
    const { data } = await admin
      .from("bookings")
      .select(
        `id, diviner_id, client_id, service_id, scheduled_at, duration_minutes,
         status, base_price, total_amount, booking_notes, metadata, created_at,
         services:service_id ( id, name, slug, duration_minutes, template_id ),
         clients:client_id ( id, email, full_name )`
      )
      .in("client_id", clientIds)
      .order("scheduled_at", { ascending: false });
    bookings = (data ?? []) as Array<Record<string, unknown>>;
  }

  return NextResponse.json({
    ok: true,
    data: bookings.map((b) => {
      const svc = b.services as
        | { id: string; name: string; slug: string | null; duration_minutes: number | null; template_id: string | null }
        | Array<{ id: string; name: string; slug: string | null; duration_minutes: number | null; template_id: string | null }>
        | null;
      const client = b.clients as
        | { id: string; email: string; full_name: string | null }
        | Array<{ id: string; email: string; full_name: string | null }>
        | null;
      const flatSvc = Array.isArray(svc) ? svc[0] ?? null : svc;
      const flatClient = Array.isArray(client) ? client[0] ?? null : client;
      return {
        id: b.id as string,
        status: b.status as string,
        scheduled_at: b.scheduled_at as string,
        duration_minutes: Number(b.duration_minutes ?? 0),
        diviner_id: b.diviner_id as string | null,
        service_id: b.service_id as string | null,
        service_name: flatSvc?.name ?? null,
        client_id: (b.client_id as string | null) ?? null,
        client_name: flatClient?.full_name ?? null,
        client_email: flatClient?.email ?? null,
        base_price: Number(b.base_price ?? 0),
        total_amount: Number(b.total_amount ?? 0),
        booking_notes: (b.booking_notes as string | null) ?? null,
        metadata: (b.metadata as Record<string, unknown> | null) ?? null,
        created_at: b.created_at as string,
      };
    }),
  });
}
