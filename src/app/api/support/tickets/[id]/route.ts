import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketMessage {
  id: string;
  ticket_id: string;
  author_user_id: string;
  author_name: string;
  author_role: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketHistoryEntry {
  id: string;
  ticket_id: string;
  actor_user_id: string | null;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

interface PatchBody {
  status?: string;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — single ticket with messages and history ────────────────────────────

export async function GET(
  _req: NextRequest,
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

  const admin = createAdminClient();

  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (ticketError) {
    return problem(500, "Database Error", ticketError.message);
  }
  if (!ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  // Ownership check — user can only see own tickets
  if (ticket.requester_user_id !== user.id) {
    return problem(403, "Forbidden", "You do not have access to this ticket.");
  }

  // Fetch all messages (both public and internal notes) for the requester
  const { data: messages, error: msgError } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return problem(500, "Database Error", msgError.message);
  }

  // Fetch history
  const { data: history, error: histError } = await admin
    .from("ticket_history")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (histError) {
    return problem(500, "Database Error", histError.message);
  }

  return NextResponse.json({
    ticket,
    messages: (messages as TicketMessage[]) ?? [],
    history: (history as TicketHistoryEntry[]) ?? [],
  });
}

// ─── PATCH — requester can only close their ticket ───────────────────────────

export async function PATCH(
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

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const admin = createAdminClient();

  const { data: ticket, error: fetchError } = await admin
    .from("support_tickets")
    .select("id, status, requester_user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  if (ticket.requester_user_id !== user.id) {
    return problem(403, "Forbidden", "You do not have access to this ticket.");
  }

  // External users can only close their tickets
  const allowedStatuses = ["closed"];
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return problem(422, "Validation Error", "You may only set status to 'closed'.");
  }

  const { data: updated, error: updateError } = await admin
    .from("support_tickets")
    .update({ status: body.status, closed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return problem(500, "Database Error", updateError.message);
  }

  // Audit log
  await admin.from("ticket_history").insert({
    ticket_id: id,
    actor_user_id: user.id,
    event_type: "status_changed",
    old_value: ticket.status,
    new_value: body.status,
  });

  return NextResponse.json(updated);
}
