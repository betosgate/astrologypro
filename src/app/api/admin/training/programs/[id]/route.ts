import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";


// GET /api/admin/training/programs/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_programs")
    .select("id, name, description, priority, is_active, is_sequential, allowed_roles, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  return NextResponse.json({ program: data });
}

// PUT /api/admin/training/programs/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    name?: string;
    description?: string | null;
    priority?: number;
    is_active?: boolean;
    is_sequential?: boolean;
    allowed_roles?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, description, priority, is_active, is_sequential, allowed_roles } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_programs")
    .update({
      name: name.trim(),
      description: description ?? null,
      priority: priority ?? 0,
      is_active: is_active ?? true,
      is_sequential: is_sequential ?? false,
      allowed_roles: Array.isArray(allowed_roles) ? allowed_roles : [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ program: data });
}

// DELETE /api/admin/training/programs/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Check if any categories are still assigned to this program
  const { count } = await admin
    .from("training_categories")
    .select("id", { count: "exact", head: true })
    .eq("training_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} categor${count === 1 ? "y is" : "ies are"} still assigned to this program. Reassign them first.` },
      { status: 409 }
    );
  }

  const { error } = await admin
    .from("training_programs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
