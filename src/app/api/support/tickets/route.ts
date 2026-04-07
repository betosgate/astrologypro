import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  ticket_number: string;
  type: string;
  category: string;
  subcategory: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requester_user_id: string;
  requester_email: string | null;
  requester_name: string | null;
  requester_role: string | null;
  assigned_to: string | null;
  assigned_team: string | null;
  resolution: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CreateTicketBody {
  type?: string;
  category: string;
  subcategory?: string;
  subject: string;
  description: string;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list own tickets (paginated) ───────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return problem(401, "Unauthorized", "You must be logged in to view tickets.");
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let query = admin
    .from("support_tickets")
    .select("*", { count: "exact" })
    .eq("requester_user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({
    tickets: (data as SupportTicket[]) ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

// ─── POST — create new ticket ─────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return problem(401, "Unauthorized", "You must be logged in to create a ticket.");
  }

  let body: CreateTicketBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const { category, subcategory, subject, description } = body;

  if (!category || !subject || !description) {
    return problem(422, "Validation Error", "category, subject, and description are required.");
  }
  if (subject.trim().length < 5) {
    return problem(422, "Validation Error", "subject must be at least 5 characters.");
  }
  if (description.trim().length < 10) {
    return problem(422, "Validation Error", "description must be at least 10 characters.");
  }

  // Resolve user metadata
  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const requesterEmail = authUser?.user?.email ?? user.email ?? null;
  const metadata = authUser?.user?.user_metadata ?? {};
  const requesterName =
    (metadata.full_name as string | null) ??
    (metadata.display_name as string | null) ??
    requesterEmail ??
    null;

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      ticket_number: "", // trigger will populate
      type: body.type ?? "support",
      category: category.trim(),
      subcategory: subcategory?.trim() ?? null,
      subject: subject.trim(),
      description: description.trim(),
      requester_user_id: user.id,
      requester_email: requesterEmail,
      requester_name: requesterName,
      requester_role: "customer",
    })
    .select()
    .single();

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  // Audit log
  await admin.from("ticket_history").insert({
    ticket_id: (ticket as SupportTicket).id,
    actor_user_id: user.id,
    event_type: "created",
    new_value: "open",
  });

  return NextResponse.json(ticket, { status: 201 });
}
