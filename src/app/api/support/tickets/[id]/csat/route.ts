import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CsatBody {
  rating: number;
  comment?: string;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── POST — submit CSAT for a resolved/closed ticket ────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return problem(401, "Unauthorized", "Authentication required.");
  }

  let body: CsatBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const { rating } = body;

  if (rating === undefined || rating === null) {
    return problem(422, "Validation Error", "rating is required.");
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return problem(422, "Validation Error", "rating must be an integer between 1 and 5.");
  }

  const admin = createAdminClient();

  // Verify ticket exists and belongs to user
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id, status, requester_user_id")
    .eq("id", id)
    .maybeSingle();

  if (ticketError) {
    return problem(500, "Database Error", ticketError.message);
  }
  if (!ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  if (ticket.requester_user_id !== user.id) {
    return problem(403, "Forbidden", "You do not have access to this ticket.");
  }

  const resolvableStatuses = ["resolved", "closed"];
  if (!resolvableStatuses.includes(ticket.status)) {
    return problem(
      422,
      "Validation Error",
      "CSAT can only be submitted for resolved or closed tickets."
    );
  }

  // Check for duplicate submission
  const { data: existing } = await admin
    .from("ticket_csat")
    .select("id")
    .eq("ticket_id", id)
    .maybeSingle();

  if (existing) {
    return problem(409, "Conflict", "CSAT has already been submitted for this ticket.");
  }

  const { data: csat, error: insertError } = await admin
    .from("ticket_csat")
    .insert({
      ticket_id: id,
      requester_user_id: user.id,
      rating: ratingNum,
      comment: body.comment?.trim() ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return problem(500, "Database Error", insertError.message);
  }

  return NextResponse.json(csat, { status: 201 });
}
