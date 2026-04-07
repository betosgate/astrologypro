import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/availability/hold
 * Creates a 10-minute hold on a time slot so two clients can't book the
 * same slot simultaneously during checkout.
 *
 * Body: { divinerId, scheduledAt, durationMinutes, sessionToken }
 *
 * DELETE /api/availability/hold
 * Releases a hold early (e.g., user goes back from payment step).
 *
 * Body: { sessionToken }
 */

export async function POST(request: NextRequest) {
  try {
    const { divinerId, scheduledAt, durationMinutes, sessionToken } =
      await request.json();

    if (!divinerId || !scheduledAt || !durationMinutes || !sessionToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check for an existing un-expired hold that overlaps this slot
    const slotStart = new Date(scheduledAt);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);

    // Fetch all active holds for this diviner and check for overlap in JS
    const { data: allActiveHolds } = await admin
      .from("booking_holds")
      .select("id, scheduled_at, duration_minutes, session_token")
      .eq("diviner_id", divinerId)
      .gt("expires_at", new Date().toISOString());

    const trueConflict = (allActiveHolds ?? []).some((h) => {
      if (h.session_token === sessionToken) return false; // our own hold
      const hStart = new Date(h.scheduled_at).getTime();
      const hEnd = hStart + (h.duration_minutes ?? 60) * 60_000;
      return hStart < slotEnd.getTime() && hEnd > slotStart.getTime();
    });

    if (trueConflict) {
      return NextResponse.json(
        { error: "This time slot is currently held by another user. Please select a different time." },
        { status: 409 }
      );
    }

    // Also check existing confirmed/pending bookings
    const { data: existingBookings } = await admin
      .from("bookings")
      .select("scheduled_at, duration_minutes")
      .eq("diviner_id", divinerId)
      .in("status", ["pending", "confirmed", "in_progress"])
      .gte("scheduled_at", new Date(slotStart.getTime() - 4 * 60 * 60 * 1000).toISOString())
      .lte("scheduled_at", slotEnd.toISOString());

    const bookingConflict = (existingBookings ?? []).some((b) => {
      const bStart = new Date(b.scheduled_at).getTime();
      const bEnd = bStart + (b.duration_minutes ?? 60) * 60_000;
      return bStart < slotEnd.getTime() && bEnd > slotStart.getTime();
    });

    if (bookingConflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please select a different time." },
        { status: 409 }
      );
    }

    // Upsert the hold (overwrite if same session is re-selecting)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin
      .from("booking_holds")
      .upsert(
        {
          diviner_id: divinerId,
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
          session_token: sessionToken,
          expires_at: expiresAt,
        },
        { onConflict: "session_token" }
      );

    return NextResponse.json({ success: true, expiresAt });
  } catch (err) {
    console.error("[hold] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionToken } = await request.json();
    if (!sessionToken) {
      return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });
    }

    const admin = createAdminClient();
    await admin.from("booking_holds").delete().eq("session_token", sessionToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hold] DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
