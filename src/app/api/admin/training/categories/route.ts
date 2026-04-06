import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

// GET /api/admin/training/categories — list all
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");

  const admin = createAdminClient();
  let query = admin
    .from("training_categories")
    .select("id, training_id, name, description, priority, is_active, is_sequential, created_at")
    .order("priority", { ascending: true });

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data });
}

// POST /api/admin/training/categories — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    .insert({
      training_id,
      name: name.trim(),
      description: description ?? null,
      priority: priority ?? 0,
      is_active: is_active ?? true,
      is_sequential: is_sequential ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
