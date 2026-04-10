import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams } from "@/lib/training/admin-list";
import {
  normalizeAdminQuizQuestions,
  replaceQuizQuestionsForLessonCompat,
} from "@/lib/training/admin-quiz-questions";

export const dynamic = "force-dynamic";

const SELECT_COLS =
  "id, lesson_id, title, questions, pass_score, is_active, created_at";

const ALLOWED_SORTS: Record<string, string> = {
  title: "title",
  pass_score: "pass_score",
  is_active: "is_active",
  created_at: "created_at",
};

async function buildQuizRowsForList(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: quizzes, error: quizError }, { data: questionCounts, error: countError }] =
    await Promise.all([
      admin
        .from("training_quizzes")
        .select(SELECT_COLS)
        .order("created_at", { ascending: false }),
      admin
        .from("quiz_questions")
        .select("lesson_id")
        .order("lesson_id", { ascending: true }),
    ]);

  if (quizError) throw quizError;
  if (countError) throw countError;

  const countsByLesson: Record<string, number> = {};
  for (const row of questionCounts ?? []) {
    countsByLesson[row.lesson_id] = (countsByLesson[row.lesson_id] ?? 0) + 1;
  }

  return (quizzes ?? []).map((quiz) => ({
    ...quiz,
    questions: Array.from({ length: countsByLesson[quiz.lesson_id] ?? 0 }, (_, idx) => idx),
  }));
}

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
    const allRows = await buildQuizRowsForList(admin);
    const search = (params.search ?? "").trim().toLowerCase();
    let rows = allRows.filter((row) => {
      const matchesSearch =
        !search || (row.title ?? "").toLowerCase().includes(search);
      const matchesStatus =
        params.status == null ||
        (params.status === "active" ? row.is_active : !row.is_active);
      return matchesSearch && matchesStatus;
    });

    const sortKey =
      (params.sortBy != null ? ALLOWED_SORTS[params.sortBy] : undefined) ??
      "created_at";
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey as keyof typeof a];
      const bv = b[sortKey as keyof typeof b];
      const multiplier = params.sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * multiplier;
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
        sensitivity: "base",
      }) * multiplier;
    });

    const total = rows.length;
    const start = (params.page - 1) * params.pageSize;
    const paged = rows.slice(start, start + params.pageSize);

    return NextResponse.json({
      quizzes: paged,
      total,
      page: params.page,
      pageSize: params.pageSize,
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
  const normalized = normalizeAdminQuizQuestions(questions);
  if (normalized.error) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_quizzes")
    .insert({
      title: title.trim(),
      lesson_id,
      pass_score: pass_score ?? 70,
      is_active: is_active ?? true,
      questions: normalized.questions,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const sync = await replaceQuizQuestionsForLessonCompat(
      admin,
      lesson_id,
      normalized.questions,
    );
    return NextResponse.json(
      { quiz: data, remediation_supported: sync.remediationSupported },
      { status: 201 },
    );
  } catch (syncError) {
    return NextResponse.json(
      {
        error:
          syncError instanceof Error ? syncError.message : "Failed to sync quiz questions.",
      },
      { status: 500 },
    );
  }
}
