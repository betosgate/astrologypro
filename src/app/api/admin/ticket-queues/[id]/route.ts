import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatchQueueBody {
  name?: string;
  team_type?: string | null;
  description?: string | null;
  is_active?: boolean;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── PATCH — update a queue ───────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: PatchQueueBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  if (body.name !== undefined && body.name.trim().length < 1) {
    return problem(422, "Validation Error", "name cannot be empty.");
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("ticket_queues")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return problem(500, "Database Error", fetchError.message);
  }
  if (!existing) {
    return problem(404, "Not Found", "Queue not found.");
  }

  // Check name uniqueness if changing
  if (body.name && body.name.trim() !== existing.name) {
    const { data: duplicate } = await admin
      .from("ticket_queues")
      .select("id")
      .eq("name", body.name.trim())
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return problem(409, "Conflict", `A queue named "${body.name.trim()}" already exists.`);
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if ("team_type" in body) updates.team_type = body.team_type?.trim() ?? null;
  if ("description" in body) updates.description = body.description?.trim() ?? null;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return problem(422, "Validation Error", "No updatable fields provided.");
  }

  const { data: queue, error: updateError } = await admin
    .from("ticket_queues")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return problem(500, "Database Error", updateError.message);
  }

  return NextResponse.json(queue);
}

// ─── DELETE — deactivate a queue (soft delete via is_active = false) ─────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("ticket_queues")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return problem(500, "Database Error", fetchError.message);
  }
  if (!existing) {
    return problem(404, "Not Found", "Queue not found.");
  }

  // Check if any open tickets are assigned to this queue
  const { count: openCount } = await admin
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("queue_id", id)
    .not("status", "in", '("resolved","closed","cancelled")');

  if ((openCount ?? 0) > 0) {
    return problem(
      409,
      "Conflict",
      `Cannot deactivate: ${openCount} open ticket(s) are assigned to this queue. Reassign them first.`
    );
  }

  const { error: updateError } = await admin
    .from("ticket_queues")
    .update({ is_active: false })
    .eq("id", id);

  if (updateError) {
    return problem(500, "Database Error", updateError.message);
  }

  return new NextResponse(null, { status: 204 });
}
