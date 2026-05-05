import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams, paginatedList } from "@/lib/training/admin-list";

export const dynamic = "force-dynamic";

const SELECT_COLS =
  "id, category_id, title, description, video_url, audio_url, duration_mins, priority, previous_lesson_id, is_active, created_at";

const ALLOWED_SORTS: Record<string, string> = {
  title: "title",
  priority: "priority",
  duration_mins: "duration_mins",
  is_active: "is_active",
  created_at: "created_at",
};

/**
 * GET /api/admin/training/lessons
 * Server-driven paginated list.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const params = parsePaginationParams(sp);
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");
  const categoryId = sp.get("category_id");

  const admin = createAdminClient();
  try {
    const result = await paginatedList(
      admin,
      "training_lessons",
      SELECT_COLS,
      params,
      ["title", "description"],
      ALLOWED_SORTS,
      { column: "priority", ascending: true },
      (q) => {
        let filtered = q;
        if (categoryId) filtered = filtered.eq("category_id", categoryId);
        if (createdFrom) filtered = filtered.gte("created_at", createdFrom);
        if (createdTo) filtered = filtered.lte("created_at", createdTo + "T23:59:59");
        return filtered;
      },
    );
    return NextResponse.json({
      lessons: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// POST /api/admin/training/lessons — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string | null;
    video_url?: string | null;
    pdf_url?: string | null;
    audio_url?: string | null;
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
    audio_url,
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
    .insert({
      title: title.trim(),
      description: description ?? null,
      video_url: video_url ?? null,
      pdf_url: pdf_url ?? null,
      audio_url: audio_url ?? null,
      content: content ?? null,
      duration_mins: duration_mins ?? null,
      category_id,
      priority: priority ?? 0,
      previous_lesson_id: previous_lesson_id ?? null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lesson: data }, { status: 201 });
}
