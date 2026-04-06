import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/analytics/quizzes
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const lessonIdFilter = sp.get("lesson_id")?.trim() ?? null;

  const admin = createAdminClient();

  // Fetch quiz questions to determine lesson scope and total_questions per lesson
  let questionsQuery = admin
    .from("quiz_questions")
    .select("id, lesson_id");

  if (lessonIdFilter) {
    questionsQuery = questionsQuery.eq("lesson_id", lessonIdFilter);
  }

  // Fetch quiz attempts — ordered by attempted_at asc to process first-attempt logic
  let attemptsQuery = admin
    .from("quiz_attempts")
    .select(
      "lesson_id, user_id, passed, score, total_questions, time_taken_seconds, attempted_at"
    )
    .order("attempted_at", { ascending: true });

  if (lessonIdFilter) {
    attemptsQuery = attemptsQuery.eq("lesson_id", lessonIdFilter);
  }

  const [questionsRes, attemptsRes] = await Promise.all([
    questionsQuery,
    attemptsQuery,
  ]);

  const questions = questionsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];

  // Derive the set of lesson_ids that have quiz data
  const lessonIdsFromQuestions = new Set(questions.map((q) => q.lesson_id));
  const lessonIdsFromAttempts = new Set(attempts.map((a) => a.lesson_id));
  const allLessonIds = [
    ...new Set([...lessonIdsFromQuestions, ...lessonIdsFromAttempts]),
  ];

  if (allLessonIds.length === 0) {
    return NextResponse.json({ quizzes: [] });
  }

  // Count questions per lesson
  const questionCountPerLesson = new Map<string, number>();
  for (const q of questions) {
    questionCountPerLesson.set(
      q.lesson_id,
      (questionCountPerLesson.get(q.lesson_id) ?? 0) + 1
    );
  }

  // Fetch lessons and their parent categories/programs for title context
  const [lessonsRes, categoriesRes, programsRes] = await Promise.all([
    admin
      .from("training_lessons")
      .select("id, title, category_id")
      .in("id", allLessonIds),
    admin.from("training_categories").select("id, name, training_id"),
    admin.from("training_programs").select("id, name"),
  ]);

  const lessons = lessonsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const programs = programsRes.data ?? [];

  const lessonMap = new Map(
    lessons.map((l: { id: string; title: string; category_id: string }) => [l.id, l])
  );
  const categoryMap = new Map(
    categories.map((c: { id: string; name: string; training_id: string }) => [c.id, c])
  );
  const programNameMap = new Map(
    programs.map((p: { id: string; name: string }) => [p.id, p.name])
  );

  // Aggregate attempt stats per lesson
  type LessonQuizAgg = {
    total_attempts: number;
    unique_users: Set<string>;
    pass_count: number;
    fail_count: number;
    total_score_pct: number;
    score_count: number;
    total_time: number;
    time_count: number;
    // For avg_attempts_to_pass: users who eventually passed
    first_attempt_users: Set<string>; // users who passed on first attempt
    // Track first attempt outcome per user
    user_first_attempt_passed: Map<string, boolean>;
    // Track attempts per user before first pass
    user_attempt_count: Map<string, number>;
    user_passed: Map<string, boolean>;
    attempts_to_pass_list: number[];
  };

  const lessonAgg = new Map<string, LessonQuizAgg>();

  const initAgg = (): LessonQuizAgg => ({
    total_attempts: 0,
    unique_users: new Set(),
    pass_count: 0,
    fail_count: 0,
    total_score_pct: 0,
    score_count: 0,
    total_time: 0,
    time_count: 0,
    first_attempt_users: new Set(),
    user_first_attempt_passed: new Map(),
    user_attempt_count: new Map(),
    user_passed: new Map(),
    attempts_to_pass_list: [],
  });

  for (const a of attempts) {
    if (!lessonAgg.has(a.lesson_id)) {
      lessonAgg.set(a.lesson_id, initAgg());
    }
    const agg = lessonAgg.get(a.lesson_id)!;

    agg.total_attempts += 1;
    agg.unique_users.add(a.user_id);

    if (a.passed) {
      agg.pass_count += 1;
    } else {
      agg.fail_count += 1;
    }

    // Score percentage
    if (
      typeof a.score === "number" &&
      typeof a.total_questions === "number" &&
      a.total_questions > 0
    ) {
      agg.total_score_pct += (a.score / a.total_questions) * 100;
      agg.score_count += 1;
    }

    // Time taken
    if (typeof a.time_taken_seconds === "number" && a.time_taken_seconds > 0) {
      agg.total_time += a.time_taken_seconds;
      agg.time_count += 1;
    }

    // First attempt pass tracking (first occurrence per user = first attempt)
    if (!agg.user_first_attempt_passed.has(a.user_id)) {
      agg.user_first_attempt_passed.set(a.user_id, a.passed);
      if (a.passed) {
        agg.first_attempt_users.add(a.user_id);
      }
    }

    // Attempts to pass: count attempts up to and including first pass
    if (!agg.user_passed.get(a.user_id)) {
      agg.user_attempt_count.set(
        a.user_id,
        (agg.user_attempt_count.get(a.user_id) ?? 0) + 1
      );
      if (a.passed) {
        agg.user_passed.set(a.user_id, true);
        agg.attempts_to_pass_list.push(agg.user_attempt_count.get(a.user_id)!);
      }
    }
  }

  const result = allLessonIds.map((lessonId) => {
    const agg = lessonAgg.get(lessonId) ?? initAgg();
    const lesson = lessonMap.get(lessonId) as
      | { id: string; title: string; category_id: string }
      | undefined;
    const cat = lesson
      ? (categoryMap.get(lesson.category_id) as
          | { id: string; name: string; training_id: string }
          | undefined)
      : undefined;
    const programName = cat ? (programNameMap.get(cat.training_id) ?? "") : "";

    const unique_users_attempted = agg.unique_users.size;
    const pass_rate =
      agg.total_attempts > 0
        ? Math.round((agg.pass_count / agg.total_attempts) * 1000) / 10
        : 0;
    const avg_score_pct =
      agg.score_count > 0
        ? Math.round((agg.total_score_pct / agg.score_count) * 10) / 10
        : 0;
    const avg_time_taken_seconds =
      agg.time_count > 0 ? Math.round(agg.total_time / agg.time_count) : 0;
    const avg_attempts_to_pass =
      agg.attempts_to_pass_list.length > 0
        ? Math.round(
            (agg.attempts_to_pass_list.reduce((s, n) => s + n, 0) /
              agg.attempts_to_pass_list.length) *
              10
          ) / 10
        : 0;
    const first_attempt_pass_count = agg.first_attempt_users.size;
    const first_attempt_pass_rate =
      unique_users_attempted > 0
        ? Math.round(
            (first_attempt_pass_count / unique_users_attempted) * 1000
          ) / 10
        : 0;

    return {
      lesson_id: lessonId,
      lesson_title: lesson?.title ?? "",
      category_title: cat?.name ?? "",
      program_title: programName,
      total_questions: questionCountPerLesson.get(lessonId) ?? 0,
      total_attempts: agg.total_attempts,
      unique_users_attempted,
      pass_count: agg.pass_count,
      fail_count: agg.fail_count,
      pass_rate,
      avg_score_pct,
      avg_attempts_to_pass,
      avg_time_taken_seconds,
      first_attempt_pass_count,
      first_attempt_pass_rate,
    };
  });

  return NextResponse.json({ quizzes: result });
}
