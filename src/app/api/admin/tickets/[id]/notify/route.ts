import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketEvent = "created" | "assigned" | "resolved" | "replied";

interface NotifyBody {
  event: TicketEvent;
  recipient_email: string;
  ticket_id: string;
}

const VALID_EVENTS: TicketEvent[] = ["created", "assigned", "resolved", "replied"];

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── POST — trigger a notification stub for a ticket event ───────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: NotifyBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  // Validate required fields
  if (!body.event || !VALID_EVENTS.includes(body.event)) {
    return problem(
      422,
      "Validation Error",
      `'event' must be one of: ${VALID_EVENTS.join(", ")}.`
    );
  }
  if (!body.recipient_email || typeof body.recipient_email !== "string") {
    return problem(422, "Validation Error", "'recipient_email' is required.");
  }
  if (!body.ticket_id || typeof body.ticket_id !== "string") {
    return problem(422, "Validation Error", "'ticket_id' is required.");
  }

  // Ensure route param and body ticket_id agree
  if (body.ticket_id !== id) {
    return problem(
      422,
      "Validation Error",
      "ticket_id in body does not match route parameter."
    );
  }

  // Fire-and-forget: log notification intent to activity log
  // Actual email delivery is a future integration point (e.g. Resend / SendGrid)
  logActivity({
    userId: admin_user.id,
    actorId: admin_user.id,
    eventCategory: "admin",
    eventType: `ticket_notify_${body.event}`,
    metadata: {
      ticket_id: body.ticket_id,
      recipient_email: body.recipient_email,
      event: body.event,
      triggered_by: admin_user.id,
    },
  });

  return NextResponse.json(
    { sent: true, event: body.event, ticket_id: body.ticket_id },
    { status: 200 }
  );
}
