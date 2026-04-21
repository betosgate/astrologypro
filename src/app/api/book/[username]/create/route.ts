import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public booking creation for the admin calendar flow.
 *
 * POST /api/book/<username>/create
 * body: { scheduledAt, durationMinutes, timezone?, clientName, clientEmail, clientNote? }
 *
 * Validates the slot is still free (no overlap with existing admin_bookings),
 * writes a row with status=confirmed, and returns the booking id.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const scheduledAtRaw = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";
  const durationMinutes = Number(body?.durationMinutes);
  const timezone =
    typeof body?.timezone === "string" && body.timezone.length > 0
      ? body.timezone
      : "America/New_York";
  const clientName =
    typeof body?.clientName === "string" ? body.clientName.trim() : "";
  const clientEmail =
    typeof body?.clientEmail === "string" ? body.clientEmail.trim().toLowerCase() : "";
  const clientNote =
    typeof body?.clientNote === "string" ? body.clientNote.trim() : "";

  if (!scheduledAtRaw || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json(
      { error: "scheduledAt and durationMinutes are required." },
      { status: 422 },
    );
  }

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt." }, { status: 422 });
  }

  if (scheduledAt.getTime() < Date.now() - 60_000) {
    return NextResponse.json(
      { error: "Cannot book a time in the past." },
      { status: 422 },
    );
  }

  if (clientName.length < 1 || clientName.length > 120) {
    return NextResponse.json(
      { error: "Name is required (max 120 characters)." },
      { status: 422 },
    );
  }

  if (!EMAIL_RE.test(clientEmail)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 422 },
    );
  }

  if (clientNote.length > 2000) {
    return NextResponse.json(
      { error: "Note is too long (max 2000 characters)." },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .ilike("username", username)
    .maybeSingle();

  if (!adminRow?.user_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Overlap guard — reject if any existing confirmed booking overlaps the new
  // window. Query a small neighborhood around the target to keep it cheap.
  const windowStart = new Date(scheduledAt.getTime() - 6 * 60 * 60_000);
  const windowEnd = new Date(scheduledAt.getTime() + 6 * 60 * 60_000);
  const { data: existing } = await admin
    .from("admin_bookings")
    .select("scheduled_at, duration_minutes")
    .eq("admin_user_id", adminRow.user_id)
    .eq("status", "confirmed")
    .gte("scheduled_at", windowStart.toISOString())
    .lt("scheduled_at", windowEnd.toISOString());

  const newStart = scheduledAt.getTime();
  const newEnd = newStart + durationMinutes * 60_000;
  const overlap = (existing ?? []).some((row) => {
    const otherStart = new Date(String(row.scheduled_at)).getTime();
    const otherEnd =
      otherStart + (Number(row.duration_minutes) || durationMinutes) * 60_000;
    return newStart < otherEnd && otherStart < newEnd;
  });
  if (overlap) {
    return NextResponse.json(
      { error: "That slot is no longer available. Please pick another." },
      { status: 409 },
    );
  }

  const { data: inserted, error } = await admin
    .from("admin_bookings")
    .insert({
      admin_user_id: adminRow.user_id,
      client_name: clientName,
      client_email: clientEmail,
      client_note: clientNote || null,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: durationMinutes,
      timezone,
      status: "confirmed",
    })
    .select("id, scheduled_at, duration_minutes")
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("admin_bookings") && msg.includes("does not exist")) {
      return NextResponse.json(
        {
          error:
            "Admin booking calendar requires a pending database migration. Apply '20260421000020_admin_booking_calendar' at /admin/db/migrations.",
        },
        { status: 500 },
      );
    }
    console.error("[book/create] insert error:", error);
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: inserted.id,
      scheduledAt: inserted.scheduled_at,
      durationMinutes: inserted.duration_minutes,
    },
    { status: 201 },
  );
}
