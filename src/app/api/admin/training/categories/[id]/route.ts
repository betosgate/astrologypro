import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/training/categories/[id] — single category
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_categories")
    .select("id, training_id, name, description, priority, is_active, is_sequential, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({ category: data });
}

// PUT /api/admin/training/categories/[id] — update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    training_id?: string;
    name?: string;
    description?: string | null;
    priority?: number;
    is_active?: boolean;
    is_sequential?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { training_id, name, description, priority, is_active, is_sequential } = body;

  if (!training_id || typeof training_id !== "string") {
    return NextResponse.json({ error: "Training program is required." }, { status: 422 });
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_categories")
    .update({
      training_id,
      name: name.trim(),
      description: description ?? null,
      priority: priority ?? 0,
      is_active: is_active ?? true,
      is_sequential: is_sequential ?? false,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

// DELETE /api/admin/training/categories/[id] — delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("training_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
