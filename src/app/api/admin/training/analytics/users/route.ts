import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/analytics/users
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "25", 10)));
  const search = sp.get("search")?.trim() ?? "";
  const sort = sp.get("sort") ?? "name";
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Fetch all trainees with auth user emails via join
  // Supabase JS doesn't support direct auth.users join; use admin listUsers + merge
  const { data: traineesData, error: traineesError } = await admin
    .from("trainees")
    .select("id, user_id, display_name, training_status, created_at");

  if (traineesError) {
    return NextResponse.json({ error: "Failed to fetch trainees." }, { status: 500 });
  }

  const trainees = traineesData ?? [];
  const userIds = trainees.map((t) => t.user_id);

  // Fetch emails from auth.users via admin API
  // We page through all users and build a map
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    // Supabase admin.auth.admin.listUsers returns paginated results
    // For typical trainee volumes this is acceptable
    let authPage = 1;
    const perPage = 1000;
    while (true) {
      const { data: authData } = await admin.auth.admin.listUsers({
        page: authPage,
        perPage,
      });
      if (!authData?.users?.length) break;
      for (const u of authData.users) {
        if (u.email) emailMap.set(u.id, u.email);
      }
      if (authData.users.length < perPage) break;
      authPage++;
    }
  }

  // Apply search filter (name or email)
  let filtered = trainees.map((t) => ({
    ...t,
    email: emailMap.get(t.user_id) ?? "",
  }));

  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.display_name?.toLowerCase().includes(lower) ||
        t.email.toLowerCase().includes(lower)
    );
  }

  const total = filtered.length;

  // Fetch aggregations for all matching user_ids (before pagination for correct totals,
  // but we only need aggregated data for the current page — fetch after paginating)
  // Sort first (basic sorts that don't need aggregation)
  if (sort === "name") {
    filtered.sort((a, b) =>
      (a.display_name ?? "").localeCompare(b.display_name ?? "")
    );
  }

  // Paginate
  const paginated = filtered.slice(offset, offset + limit);
  const pageUserIds = paginated.map((t) => t.user_id);

  if (pageUserIds.length === 0) {
    return NextResponse.json({ users: [], total, page, limit });
  }

  // Fetch aggregation data for the current page's users in parallel
  const [
    enrollmentsRes,
    lessonCompletionsRes,
    quizAttemptsRes,
    lessonProgressRes,
    totalLessonsRes,
  ] = await Promise.all([
    admin
      .from("program_enrollments")
      .select("user_id, program_id, completed_at")
      .in("user_id", pageUserIds),
    admin
      .from("lesson_completions")
      .select("user_id, lesson_id")
      .in("user_id", pageUserIds),
    admin
      .from("quiz_attempts")
      .select("user_id, lesson_id, passed, attempted_at")
      .in("user_id", pageUserIds)
      .order("attempted_at", { ascending: true }),
    admin
      .from("lesson_progress")
      .select("user_id, time_spent_seconds, last_active_at")
      .in("user_id", pageUserIds),
    admin.from("training_lessons").select("id").eq("is_active", true),
  ]);

  const enrollments = enrollmentsRes.data ?? [];
  const lessonCompletions = lessonCompletionsRes.data ?? [];
  const quizAttempts = quizAttemptsRes.data ?? [];
  const lessonProgress = lessonProgressRes.data ?? [];
  const totalLessons = totalLessonsRes.data?.length ?? 0;

  // Build per-user aggregations
  type UserAgg = {
    enrolled_programs: Set<string>;
    completed_lessons: Set<string>;
    quiz_attempts_total: number;
    quiz_pass_count: number;
    quiz_pass_lesson_attempts: Map<string, number>; // lesson_id -> attempts until first pass
    time_spent_seconds: number;
    last_active_at: string | null;
  };

  const userAgg = new Map<string, UserAgg>();
  for (const uid of pageUserIds) {
    userAgg.set(uid, {
      enrolled_programs: new Set(),
      completed_lessons: new Set(),
      quiz_attempts_total: 0,
      quiz_pass_count: 0,
      quiz_pass_lesson_attempts: new Map(),
      time_spent_seconds: 0,
      last_active_at: null,
    });
  }

  for (const e of enrollments) {
    const agg = userAgg.get(e.user_id);
    if (!agg) continue;
    agg.enrolled_programs.add(e.program_id);
  }

  for (const lc of lessonCompletions) {
    const agg = userAgg.get(lc.user_id);
    if (!agg) continue;
    agg.completed_lessons.add(lc.lesson_id);
  }

  // Track attempts per user+lesson in order to compute avg_attempts_to_pass
  const userLessonAttemptCount = new Map<string, number>();
  const userLessonPassed = new Map<string, boolean>();

  for (const qa of quizAttempts) {
    const agg = userAgg.get(qa.user_id);
    if (!agg) continue;
    agg.quiz_attempts_total += 1;
    if (qa.passed) agg.quiz_pass_count += 1;

    const ulKey = `${qa.user_id}:${qa.lesson_id}`;
    if (!userLessonPassed.get(ulKey)) {
      // still counting attempts before first pass
      userLessonAttemptCount.set(
        ulKey,
        (userLessonAttemptCount.get(ulKey) ?? 0) + 1
      );
      if (qa.passed) {
        userLessonPassed.set(ulKey, true);
        agg.quiz_pass_lesson_attempts.set(
          qa.lesson_id,
          userLessonAttemptCount.get(ulKey)!
        );
      }
    }
  }

  for (const lp of lessonProgress) {
    const agg = userAgg.get(lp.user_id);
    if (!agg) continue;
    agg.time_spent_seconds += lp.time_spent_seconds ?? 0;
    if (
      lp.last_active_at &&
      (!agg.last_active_at || lp.last_active_at > agg.last_active_at)
    ) {
      agg.last_active_at = lp.last_active_at;
    }
  }

  // Build result rows
  let users = paginated.map((t) => {
    const agg = userAgg.get(t.user_id)!;
    const completed_lessons = agg.completed_lessons.size;
    const progress_pct =
      totalLessons > 0
        ? Math.round((completed_lessons / totalLessons) * 1000) / 10
        : 0;
    const quiz_pass_rate =
      agg.quiz_attempts_total > 0
        ? Math.round((agg.quiz_pass_count / agg.quiz_attempts_total) * 1000) /
          10
        : 0;
    const passAttemptValues = [...agg.quiz_pass_lesson_attempts.values()];
    const avg_attempts_to_pass =
      passAttemptValues.length > 0
        ? Math.round(
            (passAttemptValues.reduce((s, n) => s + n, 0) /
              passAttemptValues.length) *
              10
          ) / 10
        : 0;

    return {
      user_id: t.user_id,
      display_name: t.display_name ?? "",
      email: t.email,
      training_status: t.training_status ?? "active",
      enrolled_programs: agg.enrolled_programs.size,
      completed_lessons,
      total_lessons: totalLessons,
      progress_pct,
      quiz_attempts_total: agg.quiz_attempts_total,
      quiz_pass_count: agg.quiz_pass_count,
      quiz_pass_rate,
      avg_attempts_to_pass,
      time_spent_seconds: agg.time_spent_seconds,
      last_active_at: agg.last_active_at,
    };
  });

  // Apply aggregation-dependent sorts after building rows
  if (sort === "quiz_pass_rate") {
    users.sort((a, b) => b.quiz_pass_rate - a.quiz_pass_rate);
  } else if (sort === "time_spent") {
    users.sort((a, b) => b.time_spent_seconds - a.time_spent_seconds);
  } else if (sort === "lessons_completed") {
    users.sort((a, b) => b.completed_lessons - a.completed_lessons);
  }

  return NextResponse.json({ users, total, page, limit });
}
