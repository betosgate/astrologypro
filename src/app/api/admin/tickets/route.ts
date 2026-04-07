import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateJobTicketBody {
  type: string;
  category: string;
  subcategory?: string;
  subject: string;
  description: string;
  priority?: string;
  assigned_to?: string;
  assigned_team?: string;
  requester_email?: string;
  requester_name?: string;
  requester_role?: string;
  tags?: string[];
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list all tickets (admin only) ─────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const priorityFilter = searchParams.get("priority") ?? "";
  const assignedTo = searchParams.get("assigned_to") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1), 200);
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("support_tickets")
    .select("*", { count: "exact" })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (typeFilter && typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }
  if (priorityFilter && priorityFilter !== "all") {
    query = query.eq("priority", priorityFilter);
  }
  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo);
  }

  const { data, error, count } = await query;

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({
    tickets: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

// ─── POST — create job ticket (admin only) ───────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: CreateJobTicketBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const { type, category, subject, description } = body;

  if (!type || !category || !subject || !description) {
    return problem(422, "Validation Error", "type, category, subject, and description are required.");
  }

  const validTypes = ["support", "job", "incident", "escalation", "complaint", "refund", "payout", "bug", "moderation"];
  if (!validTypes.includes(type)) {
    return problem(422, "Validation Error", `type must be one of: ${validTypes.join(", ")}.`);
  }

  const admin = createAdminClient();

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      ticket_number: "",
      type,
      category: category.trim(),
      subcategory: body.subcategory?.trim() ?? null,
      subject: subject.trim(),
      description: description.trim(),
      priority: body.priority ?? "normal",
      assigned_to: body.assigned_to ?? null,
      assigned_team: body.assigned_team ?? null,
      requester_email: body.requester_email ?? null,
      requester_name: body.requester_name ?? null,
      requester_role: body.requester_role ?? "staff",
      tags: body.tags ?? [],
      created_by: admin_user.id,
    })
    .select()
    .single();

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  // Audit log
  await admin.from("ticket_history").insert({
    ticket_id: (ticket as { id: string }).id,
    actor_user_id: admin_user.id,
    event_type: "created",
    new_value: "open",
    note: "Created by admin",
  });

  return NextResponse.json(ticket, { status: 201 });
}
