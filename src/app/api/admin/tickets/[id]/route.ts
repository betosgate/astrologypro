import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminPatchBody {
  status?: string;
  priority?: string;
  assigned_to?: string | null;
  assigned_team?: string | null;
  queue_id?: string | null;
  resolution?: string;
  // For adding an internal note or public reply via PATCH
  message?: string;
  is_internal?: boolean;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — single ticket with full message thread (admin) ────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
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

  // Fetch ALL messages (public + internal) for admin
  const { data: messages, error: msgError } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return problem(500, "Database Error", msgError.message);
  }

  const { data: history, error: histError } = await admin
    .from("ticket_history")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (histError) {
    return problem(500, "Database Error", histError.message);
  }

  return NextResponse.json({ ticket, messages: messages ?? [], history: history ?? [] });
}

// ─── PATCH — admin update (status, priority, assignment, resolution, message) ─

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: AdminPatchBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const admin = createAdminClient();

  const { data: ticket, error: fetchError } = await admin
    .from("support_tickets")
    .select("id, status, priority, assigned_to")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  const updates: Record<string, unknown> = {};
  const historyEntries: Array<{
    ticket_id: string;
    actor_user_id: string;
    event_type: string;
    old_value?: string;
    new_value?: string;
    note?: string;
  }> = [];

  if (body.status && body.status !== ticket.status) {
    const validStatuses = ["open", "in_progress", "waiting_requester", "waiting_internal", "escalated", "resolved", "closed", "cancelled"];
    if (!validStatuses.includes(body.status)) {
      return problem(422, "Validation Error", `Invalid status: ${body.status}`);
    }
    updates.status = body.status;
    if (body.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }
    if (body.status === "closed") {
      updates.closed_at = new Date().toISOString();
    }
    historyEntries.push({
      ticket_id: id,
      actor_user_id: admin_user.id,
      event_type: "status_changed",
      old_value: ticket.status,
      new_value: body.status,
    });
  }

  if (body.priority !== undefined && body.priority !== ticket.priority) {
    const validPriorities = ["low", "normal", "high", "urgent", "critical"];
    if (!validPriorities.includes(body.priority)) {
      return problem(422, "Validation Error", `Invalid priority: ${body.priority}`);
    }
    updates.priority = body.priority;
    historyEntries.push({
      ticket_id: id,
      actor_user_id: admin_user.id,
      event_type: "priority_changed",
      old_value: ticket.priority,
      new_value: body.priority,
    });
  }

  if ("assigned_to" in body) {
    updates.assigned_to = body.assigned_to;
    historyEntries.push({
      ticket_id: id,
      actor_user_id: admin_user.id,
      event_type: "assigned",
      old_value: ticket.assigned_to ?? undefined,
      new_value: body.assigned_to ?? undefined,
    });
  }

  if ("assigned_team" in body) {
    updates.assigned_team = body.assigned_team;
  }

  if ("queue_id" in body) {
    updates.queue_id = body.queue_id;
    historyEntries.push({
      ticket_id: id,
      actor_user_id: admin_user.id,
      event_type: "queue_changed",
      new_value: body.queue_id ?? undefined,
    });
  }

  if (body.resolution !== undefined) {
    updates.resolution = body.resolution;
  }

  let updatedTicket = ticket;

  if (Object.keys(updates).length > 0) {
    const { data: updated, error: updateError } = await admin
      .from("support_tickets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return problem(500, "Database Error", updateError.message);
    }
    updatedTicket = updated;
  }

  // Add history entries
  if (historyEntries.length > 0) {
    await admin.from("ticket_history").insert(historyEntries);
  }

  // Add message (internal note or public reply)
  if (body.message && body.message.trim().length > 0) {
    const isInternal = body.is_internal !== false; // default true for admin

    const { data: authUser } = await admin.auth.admin.getUserById(admin_user.id);
    const metadata = authUser?.user?.user_metadata ?? {};
    const authorName =
      (metadata.full_name as string | null) ??
      (metadata.display_name as string | null) ??
      authUser?.user?.email ??
      "Staff";

    await admin.from("ticket_messages").insert({
      ticket_id: id,
      author_user_id: admin_user.id,
      author_name: authorName,
      author_role: "staff",
      body: body.message.trim(),
      is_internal: isInternal,
    });

    await admin.from("ticket_history").insert({
      ticket_id: id,
      actor_user_id: admin_user.id,
      event_type: "message_added",
      new_value: isInternal ? "internal_note" : "public_reply",
    });

    // Set first_response_at if this is the first public reply from staff
    if (!isInternal) {
      const { data: existingReplies } = await admin
        .from("ticket_messages")
        .select("id")
        .eq("ticket_id", id)
        .eq("is_internal", false)
        .eq("author_role", "staff")
        .limit(2);

      if ((existingReplies ?? []).length === 1) {
        await admin
          .from("support_tickets")
          .update({ first_response_at: new Date().toISOString() })
          .eq("id", id);
      }
    }
  }

  return NextResponse.json(updatedTicket);
}
