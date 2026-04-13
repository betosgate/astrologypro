import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendRescheduleConfirmation,
} from "@/lib/email";
import { updateGoogleCalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/dashboard/bookings/[id]
 *
 * Supports two operations (both optional, can be combined):
 *   - reschedule: { new_date, new_time, timezone }
 *   - notes update: { session_notes }
 *
 * Sends appropriate emails to the client for each operation.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", user.id)
    .single();

  if (!diviner) return NextResponse.json({ error: "Diviner profile not found" }, { status: 403 });

  const body = await request.json();
  const { new_date, new_time, timezone, session_notes, client_name, attendees } = body;

  // Fetch booking + client for emails
  const { data: booking } = await admin
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, google_calendar_event_id, session_notes, client_id, questionnaire_responses, metadata, services(name), clients(email, full_name)")
    .eq("id", id)
    .eq("owner_id", diviner.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const clientRecord = (booking as Record<string, unknown>).clients as { email: string; full_name: string | null } | null;
  const svc = (booking as Record<string, unknown>).services as { name: string } | null;
  const meta = (booking as Record<string, unknown>).metadata as { availability_title?: string } | null;
  const qr = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
  const serviceName = meta?.availability_title ?? svc?.name ?? "Session";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const manageUrl = `${appUrl}/portal/bookings`;

  // Gather all recipient emails: primary client + second person + additional attendees
  const allRecipients: Array<{ email: string; name: string }> = [];
  if (clientRecord?.email) {
    allRecipients.push({ email: clientRecord.email, name: clientRecord.full_name ?? clientRecord.email });
  }
  // Second person from questionnaire (relationship readings)
  const spEmail = qr?.secondPersonEmail as string | undefined;
  const spName = qr?.secondPersonName as string | undefined;
  const spAttending = qr?.secondPersonAttending as string | undefined;
  if (spEmail && (spAttending === "yes" || spAttending === "maybe")) {
    if (!allRecipients.some((r) => r.email === spEmail)) {
      allRecipients.push({ email: spEmail, name: spName || "Guest" });
    }
  }
  // Additional attendees from questionnaire_responses.attendees
  const storedAttendees = Array.isArray(qr?.attendees) ? (qr.attendees as Array<{ name?: string; email?: string }>) : [];
  for (const a of storedAttendees) {
    if (a.email && !allRecipients.some((r) => r.email === a.email)) {
      allRecipients.push({ email: a.email, name: a.name || a.email });
    }
  }

  const updates: Record<string, unknown> = {};

  // --- Reschedule ---
  if (new_date && new_time) {
    const wallClock = new Date(`${new_date}T${new_time}:00`);
    const tz = timezone ?? "UTC";
    const tzString = wallClock.toLocaleString("en-US", { timeZone: tz });
    const tzDate = new Date(tzString);
    const offset = wallClock.getTime() - tzDate.getTime();
    const newScheduledAtUtc = new Date(wallClock.getTime() + offset).toISOString();
    updates.scheduled_at = newScheduledAtUtc;

    // Update Google Calendar event if linked
    const gcalEventId = (booking as Record<string, unknown>).google_calendar_event_id as string | null;
    if (gcalEventId) {
      updateGoogleCalendarEvent(
        diviner.id,
        gcalEventId,
        newScheduledAtUtc,
        (booking as Record<string, unknown>).duration_minutes as number
      ).catch((err) => console.error("[PATCH booking] GCal update failed:", err));
    }

    // Email all attendees
    if (allRecipients.length > 0) {
      const newDateStr = new Date(newScheduledAtUtc).toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });
      for (const recipient of allRecipients) {
        sendRescheduleConfirmation({
          to: recipient.email,
          name: recipient.name,
          divinerName: diviner.display_name,
          serviceName,
          newDate: newDateStr,
          manageUrl,
        }).catch((err) => console.error("[PATCH booking] Reschedule email failed:", err));
      }
    }
  }

  // --- Notes update ---
  if (typeof session_notes === "string") {
    const oldNotes = (booking as Record<string, unknown>).session_notes as string | null;
    const notesChanged = session_notes.trim() !== (oldNotes ?? "").trim();
    updates.session_notes = session_notes;

    // Notify all attendees if notes actually changed
    if (notesChanged && allRecipients.length > 0 && session_notes.trim()) {
      const scheduledAt = updates.scheduled_at ?? (booking as Record<string, unknown>).scheduled_at;
      const dateStr = new Date(scheduledAt as string).toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });

      // Import inline to avoid circular — use direct sendEmail
      const { sendEmail } = await import("@/lib/email");
      const { buildEmailHtml, infoCard, sectionHeading } = await import("@/lib/email-base");
      const { stripHtml } = await import("@/lib/calendar-utils");

      const plainNotes = stripHtml(session_notes);
      const html = buildEmailHtml({
        title: "Session Notes Updated",
        preheader: `${diviner.display_name} has added notes to your upcoming session`,
        content: `
          <p style="margin:0 0 16px;color:#d4d4d8;">
            <strong style="color:#f4f4f5;">${diviner.display_name}</strong> has updated
            the notes for your <strong style="color:#f4f4f5;">${serviceName}</strong>
            session on <strong style="color:#f4f4f5;">${dateStr}</strong>.
          </p>
          ${sectionHeading("Session Notes")}
          ${infoCard(`<span style="white-space:pre-wrap;color:#d4d4d8;">${plainNotes}</span>`)}
        `,
        ctaText: "View Booking",
        ctaUrl: manageUrl,
        footer: "AstrologyPro &mdash; Run Your Divination Business",
      });

      for (const recipient of allRecipients) {
        sendEmail({
          to: recipient.email,
          subject: `Notes updated for your ${serviceName} session`,
          html,
        }).catch((err) => console.error("[PATCH booking] Notes email failed:", err));
      }
    }
  }

  // --- Client name update ---
  let clientUpdated = false;
  if (typeof client_name === "string" && client_name.trim()) {
    const clientId = (booking as Record<string, unknown>).client_id as string | null;
    if (clientId) {
      const { error: clientErr } = await admin
        .from("clients")
        .update({ full_name: client_name.trim() })
        .eq("id", clientId);
      if (clientErr) {
        console.error("[PATCH booking] Client name update error:", clientErr);
      } else {
        clientUpdated = true;
      }
    }
  }

  // --- Attendees update ---
  if (Array.isArray(attendees)) {
    const existingQR = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
    updates.questionnaire_responses = {
      ...(existingQR ?? {}),
      attendees: attendees.filter(
        (a: { name?: string; email?: string }) => a.name?.trim() || a.email?.trim()
      ),
    };
  }

  if (Object.keys(updates).length === 0 && !clientUpdated) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await admin
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .eq("owner_id", diviner.id);

    if (updateError) {
      console.error("[PATCH booking] DB update error:", updateError);
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/dashboard/bookings/[id]
 *
 * Cancels a booking for the authenticated diviner.
 * Sends cancellation emails to all attendees and deletes Google Calendar event.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name, username")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 403 });
  }

  // Fetch full booking data before deleting — needed for emails + GCal cleanup
  const { data: booking } = await admin
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, google_calendar_event_id, questionnaire_responses, metadata, services(name), clients(email, full_name)")
    .eq("id", id)
    .eq("owner_id", diviner.id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    const { error } = await admin
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("owner_id", diviner.id);

    if (error) {
      console.error("[api/dashboard/bookings] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }

    // Delete Google Calendar event (sendUpdates=all will notify attendees via Google)
    const gcalEventId = (booking as Record<string, unknown>).google_calendar_event_id as string | null;
    if (gcalEventId) {
      import("@/lib/google-calendar").then(({ deleteGoogleCalendarEvent }) => {
        deleteGoogleCalendarEvent(diviner.id, gcalEventId).catch((err) =>
          console.error("[DELETE booking] GCal delete failed:", err)
        );
      }).catch(() => {});
    }

    // Gather all recipient emails
    const clientRecord = (booking as Record<string, unknown>).clients as { email: string; full_name: string | null } | null;
    const qr = (booking as Record<string, unknown>).questionnaire_responses as Record<string, unknown> | null;
    const meta = (booking as Record<string, unknown>).metadata as { availability_title?: string } | null;
    const svc = (booking as Record<string, unknown>).services as { name: string } | null;
    const bookingServiceName = meta?.availability_title ?? svc?.name ?? "Session";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
    const rebookUrl = `${appUrl}/${diviner.username ?? ""}`;

    const cancelRecipients: Array<{ email: string; name: string }> = [];
    if (clientRecord?.email) {
      cancelRecipients.push({ email: clientRecord.email, name: clientRecord.full_name ?? clientRecord.email });
    }
    const spEmail = qr?.secondPersonEmail as string | undefined;
    const spName = qr?.secondPersonName as string | undefined;
    const spAttending = qr?.secondPersonAttending as string | undefined;
    if (spEmail && (spAttending === "yes" || spAttending === "maybe")) {
      if (!cancelRecipients.some((r) => r.email === spEmail)) {
        cancelRecipients.push({ email: spEmail, name: spName || "Guest" });
      }
    }
    const storedAttendees = Array.isArray(qr?.attendees) ? (qr.attendees as Array<{ name?: string; email?: string }>) : [];
    for (const a of storedAttendees) {
      if (a.email && !cancelRecipients.some((r) => r.email === a.email)) {
        cancelRecipients.push({ email: a.email, name: a.name || a.email });
      }
    }

    // Send cancellation emails to all attendees
    if (cancelRecipients.length > 0) {
      import("@/lib/email").then(({ sendCancellationConfirmation }) => {
        for (const recipient of cancelRecipients) {
          sendCancellationConfirmation({
            to: recipient.email,
            name: recipient.name,
            divinerName: diviner.display_name,
            serviceName: bookingServiceName,
            rebookUrl,
          }).catch((err) => console.error("[DELETE booking] Cancel email failed:", err));
        }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/dashboard/bookings] DELETE catch:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
