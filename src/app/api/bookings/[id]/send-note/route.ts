import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function noteEmailHtml({
  recipientName,
  divinerName,
  serviceName,
  note,
  rebookUrl,
}: {
  recipientName: string;
  divinerName: string;
  serviceName: string;
  note: string;
  rebookUrl: string;
}): string {
  // Escape HTML in the note so it renders safely
  const safeNote = note
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#0f0f0f;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">AstrologyPro</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">A note from your practitioner</p>
            <h1 style="margin:0 0 24px;color:#111827;font-size:22px;font-weight:700;line-height:1.3;">Hi ${recipientName},</h1>
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              ${divinerName} has sent you the following note regarding your <strong>${serviceName}</strong> session:
            </p>
            <!-- Note block -->
            <div style="background:#f8f7ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:20px 24px;margin:0 0 28px;">
              <p style="margin:0;color:#1f2937;font-size:15px;line-height:1.7;">${safeNote}</p>
            </div>
            <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
              If you have any questions or would like to follow up, you can reply to this email or book a new session with ${divinerName}.
            </p>
            <a href="${rebookUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
              Book a Session
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
              This note was sent by ${divinerName} via AstrologyPro. You received this because you are a participant in a session with this practitioner.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { note?: string };
  const note = body.note?.trim();

  if (!note) {
    return NextResponse.json({ error: "Note content is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch booking + diviner + client
  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select(
      "id, diviner_id, client_id, status, questionnaire_responses, metadata, clients(full_name, email), diviners(id, display_name, username), services(name)"
    )
    .eq("id", id)
    .single();

  if (bErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Verify diviner owns this booking
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name, username")
    .eq("user_id", user.id)
    .single();

  if (!diviner || diviner.id !== booking.diviner_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status === "canceled") {
    return NextResponse.json(
      { error: "Cannot send notes for a cancelled booking" },
      { status: 422 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const rebookUrl = `${appUrl}/${diviner.username ?? ""}`;
  const divinerName = diviner.display_name ?? "Your Practitioner";
  const meta = booking.metadata as { availability_title?: string } | null;
  const serviceName =
    meta?.availability_title ??
    (booking.services as { name?: string } | null)?.name ??
    "Session";

  // Collect all recipients: primary client + attendees from questionnaire_responses
  const clientData = booking.clients as { full_name?: string; email?: string } | null;
  const qr = booking.questionnaire_responses as Record<string, unknown> | null;

  const recipients: Array<{ name: string; email: string }> = [];

  if (clientData?.email) {
    recipients.push({
      name: clientData.full_name || "Client",
      email: clientData.email,
    });
  }

  // Additional attendees from questionnaire_responses
  const spEmail = qr?.secondPersonEmail as string | undefined;
  const spName = qr?.secondPersonName as string | undefined;
  const spAttending = qr?.secondPersonAttending as string | undefined;
  if (spEmail && (spAttending === "yes" || spAttending === "maybe")) {
    if (!recipients.some((r) => r.email === spEmail)) {
      recipients.push({ name: spName || "Guest", email: spEmail });
    }
  }

  const storedAttendees = Array.isArray(qr?.attendees)
    ? (qr!.attendees as Array<{ name?: string; email?: string }>)
    : [];
  for (const a of storedAttendees) {
    if (a.email && !recipients.some((r) => r.email === a.email)) {
      recipients.push({ name: a.name || a.email, email: a.email });
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No client email found for this booking" },
      { status: 422 }
    );
  }

  // Send to all recipients
  const results: Array<{ email: string; success: boolean; error?: string }> = [];

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject: `A note from ${divinerName} — ${serviceName}`,
        html: noteEmailHtml({
          recipientName: recipient.name,
          divinerName,
          serviceName,
          note,
          rebookUrl,
        }),
      });
      results.push({ email: recipient.email, success: true });
    } catch (err) {
      results.push({
        email: recipient.email,
        success: false,
        error: err instanceof Error ? err.message : "Send failed",
      });
    }
  }

  const allFailed = results.every((r) => !r.success);
  if (allFailed) {
    return NextResponse.json(
      { error: "Failed to send note to all recipients", results },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, recipients: results });
}
