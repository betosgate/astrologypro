import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/analytics/overview
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Run all independent queries in parallel
  const [
    traineesRes,
    programsRes,
    categoriesRes,
    lessonsRes,
    quizAttemptsRes,
    lessonCompletionsRes,
    categoryCompletionsRes,
    lessonProgressRes,
    enrollmentsRes,
  ] = await Promise.all([
    admin.from("trainees").select("id, training_status"),
    admin.from("training_programs").select("id").eq("is_active", true),
    admin.from("training_categories").select("id").eq("is_active", true),
    admin.from("training_lessons").select("id").eq("is_active", true),
    admin.from("quiz_attempts").select("passed, lesson_id, user_id"),
    admin.from("lesson_completions").select("id"),
    admin.from("category_completions").select("id"),
    admin.from("lesson_progress").select("time_spent_seconds"),
    admin
      .from("program_enrollments")
      .select("program_id, completed_at, user_id"),
  ]);

  // Trainees
  const trainees = traineesRes.data ?? [];
  const total_trainees = trainees.length;
  const active_trainees = trainees.filter(
    (t) => t.training_status !== "inactive"
  ).length;

  // Counts
  const total_programs = programsRes.data?.length ?? 0;
  const total_categories = categoriesRes.data?.length ?? 0;
  const total_lessons = lessonsRes.data?.length ?? 0;

  // Quiz stats
  const quizAttempts = quizAttemptsRes.data ?? [];
  const total_quiz_attempts = quizAttempts.length;
  const passedAttempts = quizAttempts.filter((a) => a.passed).length;
  const overall_quiz_pass_rate =
    total_quiz_attempts > 0
      ? Math.round((passedAttempts / total_quiz_attempts) * 1000) / 10
      : 0;

  // avg_attempts_to_pass: for each user+lesson combo where user eventually passed,
  // count how many attempts occurred up to and including the first pass
  const userLessonAttempts = new Map<string, { passed: boolean }[]>();
  for (const attempt of quizAttempts) {
    const key = `${attempt.user_id}:${attempt.lesson_id}`;
    if (!userLessonAttempts.has(key)) userLessonAttempts.set(key, []);
    userLessonAttempts.get(key)!.push({ passed: attempt.passed });
  }
  const attemptsToPassList: number[] = [];
  for (const attempts of userLessonAttempts.values()) {
    const firstPassIdx = attempts.findIndex((a) => a.passed);
    if (firstPassIdx !== -1) {
      attemptsToPassList.push(firstPassIdx + 1);
    }
  }
  const avg_attempts_to_pass =
    attemptsToPassList.length > 0
      ? Math.round(
          (attemptsToPassList.reduce((s, n) => s + n, 0) /
            attemptsToPassList.length) *
            10
        ) / 10
      : 0;

  // Lesson/category completions
  const total_lesson_completions = lessonCompletionsRes.data?.length ?? 0;
  const total_category_completions = categoryCompletionsRes.data?.length ?? 0;

  // Avg time per lesson (from lesson_progress)
  const progressRows = lessonProgressRes.data ?? [];
  const progressWithTime = progressRows.filter(
    (r) => typeof r.time_spent_seconds === "number" && r.time_spent_seconds > 0
  );
  const avg_time_per_lesson_mins =
    progressWithTime.length > 0
      ? Math.round(
          (progressWithTime.reduce(
            (s, r) => s + (r.time_spent_seconds ?? 0),
            0
          ) /
            progressWithTime.length /
            60) *
            10
        ) / 10
      : 0;

  // Top programs: group enrollments by program_id
  const enrollments = enrollmentsRes.data ?? [];
  const programMap = new Map<
    string,
    { enrolled: number; completed: number }
  >();
  for (const e of enrollments) {
    if (!programMap.has(e.program_id)) {
      programMap.set(e.program_id, { enrolled: 0, completed: 0 });
    }
    const entry = programMap.get(e.program_id)!;
    entry.enrolled += 1;
    if (e.completed_at) entry.completed += 1;
  }

  // Fetch program names for top programs (sorted by enrolled desc, top 5)
  const topProgramIds = [...programMap.entries()]
    .sort((a, b) => b[1].enrolled - a[1].enrolled)
    .slice(0, 5)
    .map(([id]) => id);

  let top_programs: {
    id: string;
    title: string;
    enrolled: number;
    completed: number;
  }[] = [];
  if (topProgramIds.length > 0) {
    const { data: programNames } = await admin
      .from("training_programs")
      .select("id, name")
      .in("id", topProgramIds);
    const nameById = new Map(
      (programNames ?? []).map((p: { id: string; name: string }) => [
        p.id,
        p.name,
      ])
    );
    top_programs = topProgramIds.map((id) => ({
      id,
      title: nameById.get(id) ?? "",
      enrolled: programMap.get(id)!.enrolled,
      completed: programMap.get(id)!.completed,
    }));
  }

  return NextResponse.json({
    total_trainees,
    active_trainees,
    total_programs,
    total_categories,
    total_lessons,
    total_quiz_attempts,
    overall_quiz_pass_rate,
    avg_attempts_to_pass,
    total_lesson_completions,
    total_category_completions,
    avg_time_per_lesson_mins,
    top_programs,
  });
}
