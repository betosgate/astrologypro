import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams, paginatedList } from "@/lib/training/admin-list";

export const dynamic = "force-dynamic";

const SELECT_COLS =
  "id, lesson_id, title, questions, pass_score, is_active, created_at";

const ALLOWED_SORTS: Record<string, string> = {
  title: "title",
  pass_score: "pass_score",
  is_active: "is_active",
  created_at: "created_at",
};

/**
 * GET /api/admin/training/quizzes
 * Server-driven paginated list.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const params = parsePaginationParams(sp);

  const admin = createAdminClient();
  try {
    const result = await paginatedList(
      admin,
      "training_quizzes",
      SELECT_COLS,
      params,
      ["title"],
      ALLOWED_SORTS,
      { column: "created_at", ascending: false },
    );
    return NextResponse.json({
      quizzes: result.rows,
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

// POST /api/admin/training/quizzes — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    lesson_id?: string;
    pass_score?: number;
    is_active?: boolean;
    questions?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, lesson_id, pass_score, is_active, questions } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!lesson_id) {
    return NextResponse.json(
      { error: "Lesson is required." },
      { status: 400 }
    );
  }
  if (!Array.isArray(questions)) {
    return NextResponse.json(
      { error: "Questions must be an array." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_quizzes")
    .insert({
      title: title.trim(),
      lesson_id,
      pass_score: pass_score ?? 70,
      is_active: is_active ?? true,
      questions,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quiz: data }, { status: 201 });
}
