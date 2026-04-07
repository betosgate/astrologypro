import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type TaskDef = {
  id: string;
  order: number;
  title: string;
  description?: string;
};

/**
 * Validates that a tasks payload is a well-formed array of TaskDef objects.
 */
function validateTasks(tasks: unknown): tasks is TaskDef[] {
  if (!Array.isArray(tasks)) return false;
  return tasks.every(
    (t) =>
      t &&
      typeof t === "object" &&
      typeof (t as Record<string, unknown>).id === "string" &&
      (t as Record<string, unknown>).id !== "" &&
      typeof (t as Record<string, unknown>).order === "number" &&
      typeof (t as Record<string, unknown>).title === "string"
  );
}

/**
 * GET /api/admin/mystery-school/foundation/[id]
 * Returns a single foundation week by UUID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mystery_school_foundation_weeks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

/**
 * PATCH /api/admin/mystery-school/foundation/[id]
 * Allowed fields: title, description, audio_url, beto_photo_url, tasks, is_published.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Allowlist fields to prevent arbitrary column writes
  const allowed = [
    "title",
    "description",
    "audio_url",
    "beto_photo_url",
    "tasks",
    "is_published",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = body[key];
    }
  }

  // Validate tasks if provided
  if (Object.prototype.hasOwnProperty.call(patch, "tasks")) {
    if (!validateTasks(patch.tasks)) {
      return NextResponse.json(
        {
          error:
            "tasks must be an array of { id: string, order: number, title: string, description?: string }",
        },
        { status: 422 }
      );
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 422 });
  }

  patch.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mystery_school_foundation_weeks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
