import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { notifyStaffOfTicket } from "@/lib/notifications/tickets";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

/**
 * GET /api/tickets
 * RBAC: Staff see global list; End-users see only their own.
 * Unified to use the established 'support_tickets' table.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return problem(401, "Unauthorized", "You must be logged in to view tickets.");
  }

  const admin = createAdminClient();
  
  // Check if user is staff/admin
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isStaff = !!adminRow;

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const priorityFilter = searchParams.get("priority");
  const typeFilter = searchParams.get("type") || "job"; // Default to job for this endpoint
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);
  const offset = (page - 1) * limit;

  let query = admin
    .from("support_tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // RBAC Filter
  if (!isStaff) {
    query = query.eq("requester_user_id", user.id);
  } else if (searchParams.get("assigned_to")) {
    query = query.eq("assigned_to", searchParams.get("assigned_to"));
  }

  if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
  if (priorityFilter && priorityFilter !== "all") query = query.eq("priority", priorityFilter);
  if (typeFilter && typeFilter !== "all") query = query.eq("type", typeFilter);

  const { data: tickets, error, count } = await query;

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({
    tickets: tickets ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

/**
 * POST /api/tickets
 * Creates a ticket in the established 'support_tickets' table.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return problem(401, "Unauthorized", "You must be logged in to create a ticket.");
  }

  // Rate limit
  const rl = await rateLimit(`tickets-post:${user.id}`, 20, 60 * 60 * 1_000);
  if (!rl.success) {
    return rateLimitResponse(rl, "Too many requests.") as unknown as NextResponse;
  }

  const body = await req.json();
  const {
    subject,
    description,
    category,
    type = "job",
    priority = "normal",
    related_entity_id,
    related_entity_type,
    metadata = {}
  } = body;

  if (!subject || !description || !category) {
    return problem(422, "Validation Error", "subject, description, and category are required.");
  }

  const admin = createAdminClient();

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      requester_user_id: user.id,
      requester_email: user.email,
      requester_role: "staff", // Assuming staff usage for 'job' type
      subject: subject.trim(),
      description: description.trim(),
      category: category.trim(),
      type,
      priority,
      related_entity_id: related_entity_id || null,
      related_entity_type: related_entity_type || null,
      metadata,
      status: "open"
    })
    .select()
    .single();

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  const typedTicket = ticket as { id: string; subject: string; priority: string; category: string };

  // Trigger notifications
  await notifyStaffOfTicket({
    ticketId: typedTicket.id,
    subject: typedTicket.subject,
    priority: typedTicket.priority,
    category: typedTicket.category,
    creatorEmail: user.email
  });

  return NextResponse.json(ticket, { status: 201 });
}
