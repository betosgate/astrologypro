import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateTaskBody {
  title: string;
  description?: string;
  assignee_user_id?: string;
  due_at?: string;
  sort_order?: number;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list tasks for a ticket (sorted by sort_order) ────────────────────

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

  // Verify ticket exists
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (ticketError) {
    return problem(500, "Database Error", ticketError.message);
  }
  if (!ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  const { data: tasks, error } = await admin
    .from("ticket_tasks")
    .select("*")
    .eq("ticket_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({ tasks: tasks ?? [] });
}

// ─── POST — create a task for a ticket ───────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: CreateTaskBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const { title } = body;

  if (!title || title.trim().length < 1) {
    return problem(422, "Validation Error", "title is required.");
  }

  const admin = createAdminClient();

  // Verify ticket exists
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (ticketError) {
    return problem(500, "Database Error", ticketError.message);
  }
  if (!ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  const { data: task, error } = await admin
    .from("ticket_tasks")
    .insert({
      ticket_id: id,
      title: title.trim(),
      description: body.description?.trim() ?? null,
      assignee_user_id: body.assignee_user_id ?? null,
      due_at: body.due_at ?? null,
      sort_order: body.sort_order ?? 0,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json(task, { status: 201 });
}
