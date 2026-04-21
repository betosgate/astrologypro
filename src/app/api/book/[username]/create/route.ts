import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function formatBookingDateTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

/**
 * Strip HTML tags + decode common entities so rich-text availability
 * descriptions render cleanly in GCal (which doesn't render HTML).
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface AvailabilityContext {
  title: string | null;
  descriptionHtml: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
}

function availabilityHtmlBlock(ctx: AvailabilityContext | null): string {
  if (!ctx) return "";
  const descHtml = ctx.descriptionHtml
    ? `<div style="margin-top:8px;font-size:13px;color:#475569;line-height:1.5;">${ctx.descriptionHtml}</div>`
    : "";
  const windowText =
    ctx.startTime && ctx.endTime
      ? `${ctx.startTime} – ${ctx.endTime}${ctx.timezone ? ` · ${ctx.timezone}` : ""}`
      : null;
  return `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;">
    ${ctx.title ? `<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Session</div><div style="margin-top:4px;font-size:15px;font-weight:600;">${ctx.title}</div>` : ""}
    ${windowText ? `<div style="margin-top:2px;font-size:13px;color:#64748b;">${windowText}</div>` : ""}
    ${descHtml}
  </div>`;
}

function clientEmailHtml(opts: {
  clientName: string;
  hostName: string;
  dateTime: string;
  durationMinutes: number;
  note?: string | null;
  availability: AvailabilityContext | null;
}): string {
  const firstName = opts.clientName.trim().split(" ")[0] || "there";
  const noteBlock = opts.note
    ? `<p style="margin:16px 0 0;font-size:14px;color:#475569;"><strong>Your note:</strong><br/>${opts.note.replace(/\n/g, "<br/>")}</p>`
    : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
  <h1 style="margin:0 0 8px;font-size:24px;">Thank you, ${firstName}!</h1>
  <p style="margin:0 0 20px;color:#475569;">Your booking with <strong>${opts.hostName}</strong> is confirmed.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">When</div>
    <div style="margin-top:4px;font-size:16px;font-weight:600;">${opts.dateTime}</div>
    <div style="margin-top:2px;font-size:13px;color:#64748b;">${opts.durationMinutes} minutes</div>
    ${availabilityHtmlBlock(opts.availability)}
    ${noteBlock}
  </div>
  <p style="margin:24px 0 0;font-size:13px;color:#64748b;">You should also receive a separate Google Calendar invite with meeting details. Reply to that invite if you need to reschedule.</p>
</div>`;
}

function adminEmailHtml(opts: {
  clientName: string;
  clientEmail: string;
  dateTime: string;
  durationMinutes: number;
  note?: string | null;
  availability: AvailabilityContext | null;
}): string {
  const noteBlock = opts.note
    ? `<p style="margin:16px 0 0;font-size:14px;color:#475569;"><strong>Client note:</strong><br/>${opts.note.replace(/\n/g, "<br/>")}</p>`
    : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
  <h1 style="margin:0 0 8px;font-size:22px;">New calendar booking</h1>
  <p style="margin:0 0 20px;color:#475569;">Someone just booked a time on your calendar.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">When</div>
    <div style="margin-top:4px;font-size:16px;font-weight:600;">${opts.dateTime}</div>
    <div style="margin-top:2px;font-size:13px;color:#64748b;">${opts.durationMinutes} minutes</div>
    <div style="margin-top:14px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Client</div>
    <div style="margin-top:4px;font-size:15px;font-weight:500;">${opts.clientName}</div>
    <div style="margin-top:2px;font-size:13px;"><a href="mailto:${opts.clientEmail}" style="color:#2563eb;">${opts.clientEmail}</a></div>
    ${availabilityHtmlBlock(opts.availability)}
    ${noteBlock}
  </div>
</div>`;
}

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
  const availabilityId =
    typeof body?.availabilityId === "string" && body.availabilityId.length > 0
      ? body.availabilityId
      : null;

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
    .select("user_id, email, username")
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

  // Fire-and-forget: push to admin's connected Google Calendar (invites the
  // client automatically via sendUpdates=all), and send confirmation emails.
  // All non-blocking — the booking is already saved, these are best-effort.
  const hostLabel = adminRow.username ?? "your host";
  const dateTimeFormatted = formatBookingDateTime(
    scheduledAt.toISOString(),
    timezone,
  );
  const endIso = new Date(
    scheduledAt.getTime() + durationMinutes * 60_000,
  ).toISOString();

  // Look up the availability template the client picked from, so we can
  // surface its title + description on the GCal invite and confirmation emails.
  let availabilityContext: AvailabilityContext | null = null;
  if (availabilityId) {
    const { data: tpl } = await admin
      .from("availability_templates")
      .select("title, description, start_time, end_time, timezone")
      .eq("id", availabilityId)
      .eq("created_by", adminRow.user_id)
      .maybeSingle();
    if (tpl) {
      availabilityContext = {
        title: typeof tpl.title === "string" ? tpl.title : null,
        descriptionHtml:
          typeof tpl.description === "string" && tpl.description.trim().length > 0
            ? tpl.description
            : null,
        startTime: typeof tpl.start_time === "string" ? tpl.start_time : null,
        endTime: typeof tpl.end_time === "string" ? tpl.end_time : null,
        timezone: typeof tpl.timezone === "string" ? tpl.timezone : null,
      };
    }
  }

  // Build the Google Calendar event description. GCal doesn't render HTML in
  // most clients, so we include a plain-text version with the template title,
  // window, description, and the client's note.
  const descLines: string[] = [];
  if (availabilityContext?.title) {
    descLines.push(availabilityContext.title);
  }
  if (availabilityContext?.startTime && availabilityContext.endTime) {
    const windowLine = `${availabilityContext.startTime} – ${availabilityContext.endTime}${
      availabilityContext.timezone ? ` · ${availabilityContext.timezone}` : ""
    }`;
    descLines.push(windowLine);
  }
  if (availabilityContext?.descriptionHtml) {
    const plain = htmlToPlainText(availabilityContext.descriptionHtml);
    if (plain) descLines.push("", plain);
  }
  if (clientNote) {
    if (descLines.length > 0) descLines.push("", "———");
    descLines.push("Client note:", clientNote);
  }
  if (descLines.length > 0) descLines.push("", "———");
  descLines.push("Booked via AstrologyPro calendar link.");
  const gcalDescription = descLines.join("\n");

  const gcalTitle = availabilityContext?.title
    ? `${availabilityContext.title} — ${clientName}`
    : `Meeting with ${clientName}`;

  const gcalPromise = createCalendarEvent(adminRow.user_id, {
    title: gcalTitle,
    description: gcalDescription,
    startTime: scheduledAt.toISOString(),
    endTime: endIso,
    clientEmail,
    clientName,
  })
    .then(async ({ eventId }) => {
      if (!eventId) return;
      const { error: updateErr } = await admin
        .from("admin_bookings")
        .update({ google_calendar_event_id: eventId })
        .eq("id", inserted.id);
      if (updateErr) {
        const em = updateErr.message.toLowerCase();
        // If the column doesn't exist yet, don't surface — migration just
        // needs applying. The GCal event + invite still went out.
        if (!em.includes("google_calendar_event_id") && !em.includes("column")) {
          console.error("[book/create] failed to persist gcal event id:", updateErr);
        }
      }
    })
    .catch((err) => {
      console.error("[book/create] gcal createCalendarEvent failed:", err?.message ?? err);
    });

  const clientEmailPromise = sendEmail({
    to: clientEmail,
    subject: availabilityContext?.title
      ? `${availabilityContext.title} confirmed — ${dateTimeFormatted}`
      : `Booking confirmed — ${dateTimeFormatted}`,
    html: clientEmailHtml({
      clientName,
      hostName: hostLabel,
      dateTime: dateTimeFormatted,
      durationMinutes,
      note: clientNote || null,
      availability: availabilityContext,
    }),
  }).catch((err) =>
    console.error("[book/create] client email failed:", err?.message ?? err),
  );

  const adminEmailPromise = adminRow.email
    ? sendEmail({
        to: adminRow.email,
        subject: availabilityContext?.title
          ? `New booking: ${availabilityContext.title} — ${clientName} (${dateTimeFormatted})`
          : `New booking — ${clientName} (${dateTimeFormatted})`,
        html: adminEmailHtml({
          clientName,
          clientEmail,
          dateTime: dateTimeFormatted,
          durationMinutes,
          note: clientNote || null,
          availability: availabilityContext,
        }),
      }).catch((err) =>
        console.error("[book/create] admin email failed:", err?.message ?? err),
      )
    : Promise.resolve();

  // Await with a short timeout so prod Node runtimes don't cancel the
  // in-flight requests as soon as the response flushes. We don't need to
  // wait for GCal's full response, but letting the event-loop drain a tick
  // is safer than firing and immediately returning.
  await Promise.race([
    Promise.allSettled([gcalPromise, clientEmailPromise, adminEmailPromise]),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);

  return NextResponse.json(
    {
      id: inserted.id,
      scheduledAt: inserted.scheduled_at,
      durationMinutes: inserted.duration_minutes,
    },
    { status: 201 },
  );
}
