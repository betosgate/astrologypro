import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateQueueBody {
  name: string;
  team_type?: string;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list all queues (active + inactive for admin) ─────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active_only") !== "false";

  const admin = createAdminClient();

  let query = admin
    .from("ticket_queues")
    .select("id, name, team_type, is_active, created_at")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data: queues, error } = await query;

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json({ queues: queues ?? [] });
}

// ─── POST — create a new queue ────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: CreateQueueBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  if (!body.name || body.name.trim().length < 1) {
    return problem(422, "Validation Error", "name is required.");
  }

  const admin = createAdminClient();

  // Check for duplicate name
  const { data: existing } = await admin
    .from("ticket_queues")
    .select("id")
    .eq("name", body.name.trim())
    .maybeSingle();

  if (existing) {
    return problem(409, "Conflict", `A queue named "${body.name.trim()}" already exists.`);
  }

  const { data: queue, error } = await admin
    .from("ticket_queues")
    .insert({
      name: body.name.trim(),
      team_type: body.team_type?.trim() ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return problem(500, "Database Error", error.message);
  }

  return NextResponse.json(queue, { status: 201 });
}
