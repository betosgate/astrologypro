import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

/**
 * GET /api/tickets/[id]/comments
 * Unified to use the established 'ticket_messages' table.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return problem(401, "Unauthorized", "Unauthorized");

  const admin = createAdminClient();

  // Check access to the ticket
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("requester_user_id, assigned_to")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) return problem(404, "Not Found", "Ticket not found");

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isStaff = !!adminRow;

  if (!isStaff && ticket.requester_user_id !== user.id) {
    return problem(403, "Forbidden", "Access denied");
  }

  const { data: messages, error } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (error) return problem(500, "Database Error", error.message);

  return NextResponse.json(messages);
}

/**
 * POST /api/tickets/[id]/comments
 * Unified to use the established 'ticket_messages' table.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return problem(401, "Unauthorized", "Unauthorized");

  const body = await req.json();
  const { body: text, parent_id, attachments = [], is_internal = false } = body;

  if (!text) return problem(422, "Validation Error", "Message body is required");

  const admin = createAdminClient();

  // Check access
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("requester_user_id, requester_name")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) return problem(404, "Not Found", "Ticket not found");

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isStaff = !!adminRow;

  if (!isStaff && ticket.requester_user_id !== user.id) {
    return problem(403, "Forbidden", "Access denied");
  }

  // Fetch user metadata for author name
  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const metadata = authUser?.user?.user_metadata ?? {};
  const authorName =
    (metadata.full_name as string | null) ??
    (metadata.display_name as string | null) ??
    authUser?.user?.email ??
    "User";

  const { data: message, error } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      author_user_id: user.id,
      author_name: authorName,
      author_role: isStaff ? "staff" : "customer",
      parent_id: parent_id || null,
      body: text,
      attachments,
      is_internal: isStaff ? is_internal : false
    })
    .select()
    .single();

  if (error) return problem(500, "Database Error", error.message);

  // Update ticket updated_at
  await admin.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", id);

  return NextResponse.json(message, { status: 201 });
}
