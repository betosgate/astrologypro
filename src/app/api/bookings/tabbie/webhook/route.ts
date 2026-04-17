import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAppointmentFromProvider, PROVIDER_STATUS_MAP } from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

// ─── POST /api/bookings/tabbie/webhook ──────────────────────────────────────
// Receives booking lifecycle events from the external booking provider.
//
// Expected payload (generic shape — extend per actual provider):
// {
//   event: "invitee.created" | "invitee.canceled" | "provider_rescheduled" | ...
//   trainee_id?: string          -- if provider supports metadata passthrough
//   user_email?: string          -- fallback lookup by email
//   external_booking_id: string
//   external_event_id?: string
//   scheduled_start_at?: string  -- ISO 8601
//   scheduled_end_at?: string
//   timezone?: string
//   host_name?: string
//   appointment_type?: string
//   booking_link_used?: string
//   is_reschedule?: boolean
//   rescheduled_from_booking_id?: string
// }

const WEBHOOK_SECRET = process.env.TABBIE_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  // ── 1. Optional signature verification ────────────────────────────────────
  if (WEBHOOK_SECRET) {
    const signature = req.headers.get("x-tabbie-signature") ?? "";
    if (signature !== WEBHOOK_SECRET) {
      console.warn("[tabbie-webhook] invalid signature");
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── 2. Parse payload ───────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(body.event ?? "");
  const externalBookingId = String(body.external_booking_id ?? "").trim();

  if (!event) {
    return Response.json({ error: "Missing event field" }, { status: 422 });
  }

  // ── 3. Check event is known ────────────────────────────────────────────────
  if (!PROVIDER_STATUS_MAP[event]) {
    // Unknown event — accept and ignore gracefully
    console.log(`[tabbie-webhook] unknown event type '${event}' — ignoring`);
    return Response.json({ ok: true, ignored: true });
  }

  // ── 4. Resolve trainee ─────────────────────────────────────────────────────
  const admin = createAdminClient();
  let traineeId = String(body.trainee_id ?? "").trim();
  let userId = "";

  if (!traineeId) {
    // Fallback: look up by email
    const email = String(body.user_email ?? "").trim().toLowerCase();
    if (!email) {
      return Response.json({ error: "Cannot identify trainee: no trainee_id or user_email" }, { status: 422 });
    }

    const { data: authUser } = await admin.auth.admin.listUsers();
    const matchedUser = authUser?.users?.find(
      (u: { id: string; email?: string | null }) => u.email?.toLowerCase() === email
    );
    if (!matchedUser) {
      return Response.json({ error: "No user found for email" }, { status: 404 });
    }
    userId = matchedUser.id;

    const { data: trainee } = await admin
      .from("trainees")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!trainee) {
      return Response.json({ error: "Trainee record not found" }, { status: 404 });
    }
    traineeId = trainee.id;
  } else {
    const { data: trainee } = await admin
      .from("trainees")
      .select("id, user_id")
      .eq("id", traineeId)
      .maybeSingle();

    if (!trainee) {
      return Response.json({ error: "Trainee record not found" }, { status: 404 });
    }
    userId = trainee.user_id as string;
  }

  // ── 5. Determine reschedule context ───────────────────────────────────────
  const isReschedule = body.is_reschedule === true || event === "provider_rescheduled";
  let rescheduledFromId: string | null = null;
  if (isReschedule && externalBookingId) {
    const { data: oldAppt } = await admin
      .from("trainee_tabbie_appointments")
      .select("id")
      .eq("external_booking_id", String(body.rescheduled_from_booking_id ?? ""))
      .maybeSingle();
    rescheduledFromId = oldAppt?.id ?? null;
  }

  // ── 6. Sync appointment ────────────────────────────────────────────────────
  const result = await syncAppointmentFromProvider({
    traineeId,
    userId,
    externalBookingId: externalBookingId || null,
    externalEventId: String(body.external_event_id ?? "").trim() || null,
    providerEvent: event,
    scheduledStartAt: String(body.scheduled_start_at ?? "").trim() || null,
    scheduledEndAt: String(body.scheduled_end_at ?? "").trim() || null,
    timezone: String(body.timezone ?? "").trim() || null,
    hostName: String(body.host_name ?? "Tabbie").trim() || "Tabbie",
    appointmentType: String(body.appointment_type ?? "").trim() || null,
    bookingLinkUsed: String(body.booking_link_used ?? "").trim() || null,
    rawPayload: body,
    changedByType: "webhook",
    isReschedule,
    rescheduledFromAppointmentId: rescheduledFromId,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true, appointmentId: result.appointmentId });
}
