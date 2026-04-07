import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatchTaskBody {
  status?: "pending" | "in_progress" | "done" | "blocked";
  title?: string;
  description?: string;
  completed_at?: string | null;
}

// ─── Problem Details helper ───────────────────────────────────────────────────

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatus.es/${status}`, title, status, detail },
    { status }
  );
}

// ─── PATCH — update a task ────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<NextResponse> {
  const { taskId } = await params;

  const admin_user = await getAdminUser();
  if (!admin_user) {
    return problem(401, "Unauthorized", "Admin access required.");
  }

  let body: PatchTaskBody;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Bad Request", "Invalid JSON body.");
  }

  const validStatuses = ["pending", "in_progress", "done", "blocked"];
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return problem(422, "Validation Error", `status must be one of: ${validStatuses.join(", ")}.`);
  }

  if (body.title !== undefined && body.title.trim().length < 1) {
    return problem(422, "Validation Error", "title cannot be empty.");
  }

  const admin = createAdminClient();

  // Verify task exists
  const { data: existing, error: fetchError } = await admin
    .from("ticket_tasks")
    .select("id, status")
    .eq("id", taskId)
    .maybeSingle();

  if (fetchError) {
    return problem(500, "Database Error", fetchError.message);
  }
  if (!existing) {
    return problem(404, "Not Found", "Task not found.");
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    updates.status = body.status;
    // Auto-set completed_at when transitioning to done
    if (body.status === "done" && existing.status !== "done") {
      updates.completed_at = new Date().toISOString();
    }
    // Clear completed_at if moving away from done
    if (body.status !== "done" && existing.status === "done") {
      updates.completed_at = null;
    }
  }

  // Allow explicit override of completed_at
  if ("completed_at" in body) {
    updates.completed_at = body.completed_at;
  }

  if (body.title !== undefined) {
    updates.title = body.title.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() ?? null;
  }

  const { data: task, error: updateError } = await admin
    .from("ticket_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    return problem(500, "Database Error", updateError.message);
  }

  return NextResponse.json(task);
}
