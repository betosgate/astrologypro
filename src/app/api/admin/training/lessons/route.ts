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

// GET /api/admin/training/lessons — list all
export async function GET() {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_lessons")
    .select(
      "id, category_id, title, description, video_url, duration_mins, priority, is_active, created_at"
    )
    .order("priority", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lessons: data });
}

// POST /api/admin/training/lessons — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string | null;
    video_url?: string | null;
    pdf_url?: string | null;
    content?: string | null;
    duration_mins?: number | null;
    category_id?: string;
    priority?: number;
    is_active?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    title,
    description,
    video_url,
    pdf_url,
    content,
    duration_mins,
    category_id,
    priority,
    is_active,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!category_id) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_lessons")
    .insert({
      title: title.trim(),
      description: description ?? null,
      video_url: video_url ?? null,
      pdf_url: pdf_url ?? null,
      content: content ?? null,
      duration_mins: duration_mins ?? null,
      category_id,
      priority: priority ?? 0,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lesson: data }, { status: 201 });
}
