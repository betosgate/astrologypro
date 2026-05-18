import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageBody {
  body: string;
  is_internal?: boolean;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── POST — add a message/reply to a ticket ───────────────────────────────────

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

  let body: MessageBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  if (!body.body || body.body.trim().length < 1) {
    return problem(422, "Validation Error", "body is required.");
  }

  const admin = createAdminClient();

  // Verify ticket exists and user owns it
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

  if (ticket.status === "closed" || ticket.status === "cancelled") {
    return problem(422, "Validation Error", "Cannot add messages to a closed or cancelled ticket.");
  }

  // Resolve author name
  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const metadata = authUser?.user?.user_metadata ?? {};
  const authorName =
    (metadata.full_name as string | null) ??
    (metadata.display_name as string | null) ??
    authUser?.user?.email ??
    "Customer";

  // Allow ticket creators to write internal/private notes on their tickets
  const isInternal = body.is_internal === true;

  const { data: message, error: insertError } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      author_user_id: user.id,
      author_name: authorName,
      author_role: "customer",
      body: body.body.trim(),
      is_internal: isInternal,
      attachments: body.attachments ?? [],
    })
    .select()
    .single();

  if (insertError) {
    return problem(500, "Database Error", insertError.message);
  }

  // Audit log
  await admin.from("ticket_history").insert({
    ticket_id: id,
    actor_user_id: user.id,
    event_type: "message_added",
    new_value: "public_reply",
  });

  // If ticket was waiting on requester, reopen it
  if (ticket.status === "waiting_requester") {
    await admin
      .from("support_tickets")
      .update({ status: "open" })
      .eq("id", id);

    await admin.from("ticket_history").insert({
      ticket_id: id,
      actor_user_id: user.id,
      event_type: "status_changed",
      old_value: "waiting_requester",
      new_value: "open",
      note: "Requester replied",
    });
  }

  return NextResponse.json(message, { status: 201 });
}
