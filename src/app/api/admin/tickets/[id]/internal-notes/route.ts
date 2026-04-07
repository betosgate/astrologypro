import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InternalNoteBody {
  body: string;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list all internal notes for a ticket (admin only) ─────────────────

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

  const { data: notes, error } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .eq("is_internal", true)
    .order("created_at", { ascending: true });

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({ notes: notes ?? [] });
}

// ─── POST — create an internal note (admin only) ─────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: InternalNoteBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  if (!body.body || body.body.trim().length < 1) {
    return problem(422, "Validation Error", "body is required.");
  }

  const admin = createAdminClient();

  // Verify ticket exists
  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (ticketError) {
    return problem(500, "Database Error", ticketError.message);
  }
  if (!ticket) {
    return problem(404, "Not Found", "Ticket not found.");
  }

  // Resolve author name from admin user
  const { data: authUser } = await admin.auth.admin.getUserById(admin_user.id);
  const metadata = authUser?.user?.user_metadata ?? {};
  const authorName =
    (metadata.full_name as string | null) ??
    (metadata.display_name as string | null) ??
    authUser?.user?.email ??
    "Staff";

  const { data: note, error: insertError } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      author_user_id: admin_user.id,
      author_name: authorName,
      author_role: "staff",
      body: body.body.trim(),
      is_internal: true,
    })
    .select()
    .single();

  if (insertError) {
    return problem(500, "Database Error", insertError.message);
  }

  // Audit log — fire and forget
  admin.from("ticket_history").insert({
    ticket_id: id,
    actor_user_id: admin_user.id,
    event_type: "message_added",
    new_value: "internal_note",
  }).then(() => {}, () => {});

  return NextResponse.json(note, { status: 201 });
}
