import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/lessons/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_lessons")
    .select(
      "id, category_id, title, description, video_url, pdf_url, content, duration_mins, priority, previous_lesson_id, is_active, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json({ lesson: data });
}

// PUT /api/admin/training/lessons/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    title?: string;
    description?: string | null;
    video_url?: string | null;
    pdf_url?: string | null;
    content?: string | null;
    duration_mins?: number | null;
    category_id?: string;
    priority?: number;
    previous_lesson_id?: string | null;
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
    previous_lesson_id,
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
    .update({
      title: title.trim(),
      description: description ?? null,
      video_url: video_url ?? null,
      pdf_url: pdf_url ?? null,
      content: content ?? null,
      duration_mins: duration_mins ?? null,
      category_id,
      priority: priority ?? 0,
      previous_lesson_id: previous_lesson_id ?? null,
      is_active: is_active ?? true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lesson: data });
}

// DELETE /api/admin/training/lessons/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("training_lessons")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
