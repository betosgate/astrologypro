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

// GET /api/admin/training/analytics/lessons
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const categoryIdFilter = sp.get("category_id")?.trim() ?? null;

  const admin = createAdminClient();

  // Fetch lessons
  let lessonsQuery = admin
    .from("training_lessons")
    .select("id, title, category_id, is_active, created_at")
    .order("created_at", { ascending: false });

  if (categoryIdFilter) {
    lessonsQuery = lessonsQuery.eq("category_id", categoryIdFilter);
  }

  const lessonsRes = await lessonsQuery;
  const lessons = lessonsRes.data ?? [];

  if (lessons.length === 0) {
    return NextResponse.json({ lessons: [] });
  }

  const lessonIds = lessons.map((l) => l.id);
  const categoryIds = [...new Set(lessons.map((l) => l.category_id))];

  // Fetch categories and programs for title lookups, plus aggregation data in parallel
  const [
    categoriesRes,
    programsRes,
    lessonCompletionsRes,
    lessonProgressRes,
    quizAttemptsRes,
  ] = await Promise.all([
    admin
      .from("training_categories")
      .select("id, name, training_id")
      .in("id", categoryIds),
    admin.from("training_programs").select("id, name"),
    admin
      .from("lesson_completions")
      .select("lesson_id, user_id")
      .in("lesson_id", lessonIds),
    admin
      .from("lesson_progress")
      .select("lesson_id, user_id, time_spent_seconds")
      .in("lesson_id", lessonIds),
    admin
      .from("quiz_attempts")
      .select("lesson_id, user_id, passed, attempted_at")
      .in("lesson_id", lessonIds)
      .order("attempted_at", { ascending: true }),
  ]);

  const categories = categoriesRes.data ?? [];
  const programs = programsRes.data ?? [];
  const lessonCompletions = lessonCompletionsRes.data ?? [];
  const lessonProgress = lessonProgressRes.data ?? [];
  const quizAttempts = quizAttemptsRes.data ?? [];

  // Build lookup maps
  const categoryMap = new Map(
    categories.map((c: { id: string; name: string; training_id: string }) => [
      c.id,
      c,
    ])
  );
  const programNameMap = new Map(
    programs.map((p: { id: string; name: string }) => [p.id, p.name])
  );

  // Aggregate lesson completions
  const lessonCompletionStats = new Map<string, Set<string>>();
  for (const lc of lessonCompletions) {
    if (!lessonCompletionStats.has(lc.lesson_id)) {
      lessonCompletionStats.set(lc.lesson_id, new Set());
    }
    lessonCompletionStats.get(lc.lesson_id)!.add(lc.user_id);
  }

  // Aggregate lesson progress (unique users started + avg time)
  const lessonProgressStats = new Map<
    string,
    { users: Set<string>; total_time: number; count: number }
  >();
  for (const lp of lessonProgress) {
    if (!lessonProgressStats.has(lp.lesson_id)) {
      lessonProgressStats.set(lp.lesson_id, {
        users: new Set(),
        total_time: 0,
        count: 0,
      });
    }
    const stats = lessonProgressStats.get(lp.lesson_id)!;
    stats.users.add(lp.user_id);
    if (lp.time_spent_seconds) {
      stats.total_time += lp.time_spent_seconds;
      stats.count += 1;
    }
  }

  // Aggregate quiz attempts per lesson
  // Track: total attempts, passed attempts, unique users, avg_attempts_to_pass
  const lessonQuizStats = new Map<
    string,
    { total: number; passed: number; users: Set<string> }
  >();
  // For avg_attempts_to_pass: track per user+lesson
  const userLessonAttemptCount = new Map<string, number>();
  const userLessonPassed = new Map<string, boolean>();
  const lessonAttemptsToPassList = new Map<string, number[]>();

  for (const qa of quizAttempts) {
    if (!lessonQuizStats.has(qa.lesson_id)) {
      lessonQuizStats.set(qa.lesson_id, {
        total: 0,
        passed: 0,
        users: new Set(),
      });
    }
    const stats = lessonQuizStats.get(qa.lesson_id)!;
    stats.total += 1;
    if (qa.passed) stats.passed += 1;
    stats.users.add(qa.user_id);

    const ulKey = `${qa.user_id}:${qa.lesson_id}`;
    if (!userLessonPassed.get(ulKey)) {
      userLessonAttemptCount.set(ulKey, (userLessonAttemptCount.get(ulKey) ?? 0) + 1);
      if (qa.passed) {
        userLessonPassed.set(ulKey, true);
        if (!lessonAttemptsToPassList.has(qa.lesson_id)) {
          lessonAttemptsToPassList.set(qa.lesson_id, []);
        }
        lessonAttemptsToPassList.get(qa.lesson_id)!.push(userLessonAttemptCount.get(ulKey)!);
      }
    }
  }

  const result = lessons.map((l) => {
    const cat = categoryMap.get(l.category_id) as
      | { id: string; name: string; training_id: string }
      | undefined;
    const programName = cat ? (programNameMap.get(cat.training_id) ?? "") : "";

    const completedUsers = lessonCompletionStats.get(l.id)?.size ?? 0;
    const progressStats = lessonProgressStats.get(l.id);
    const unique_users_started = progressStats?.users.size ?? 0;
    const completion_rate =
      unique_users_started > 0
        ? Math.round((completedUsers / unique_users_started) * 1000) / 10
        : 0;
    const avg_time_spent_seconds =
      progressStats && progressStats.count > 0
        ? Math.round(progressStats.total_time / progressStats.count)
        : 0;

    const quizStats = lessonQuizStats.get(l.id) ?? {
      total: 0,
      passed: 0,
      users: new Set<string>(),
    };
    const avg_quiz_attempts =
      quizStats.users.size > 0
        ? Math.round((quizStats.total / quizStats.users.size) * 10) / 10
        : 0;
    const quiz_pass_rate =
      quizStats.total > 0
        ? Math.round((quizStats.passed / quizStats.total) * 1000) / 10
        : 0;

    const attemptsToPassValues = lessonAttemptsToPassList.get(l.id) ?? [];
    const avg_attempts_to_pass =
      attemptsToPassValues.length > 0
        ? Math.round(
            (attemptsToPassValues.reduce((s, n) => s + n, 0) /
              attemptsToPassValues.length) *
              10
          ) / 10
        : 0;

    return {
      id: l.id,
      title: l.title,
      category_id: l.category_id,
      category_title: cat?.name ?? "",
      program_title: programName,
      total_completions: completedUsers,
      unique_users_started,
      completion_rate,
      avg_time_spent_seconds,
      avg_quiz_attempts,
      quiz_pass_rate,
      avg_attempts_to_pass,
      created_at: l.created_at,
    };
  });

  return NextResponse.json({ lessons: result });
}
