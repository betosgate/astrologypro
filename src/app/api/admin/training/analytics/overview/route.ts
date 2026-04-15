import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/analytics/overview
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Run all independent queries in parallel
  const [
    traineesRes,
    programsRes,
    lessonsRes,
    quizAttemptsRes,
    lessonCompletionsRes,
    categoryCompletionsRes,
    lessonProgressRes,
    programProgressRes,
  ] = await Promise.all([
    admin.from("trainees").select("id, training_status"),
    admin.from("training_programs").select("id, name").eq("is_active", true),
    admin.from("training_lessons").select("id").eq("is_active", true),
    admin.from("quiz_attempts").select("passed, lesson_id, user_id"),
    admin.from("lesson_completions").select("id"),
    admin.from("category_completions").select("id"),
    admin.from("lesson_progress").select("time_spent_seconds"),
    admin
      .from("user_program_progress")
      .select("program_id, started_at, completed_at, progress_pct"),
  ]);

  // Trainees
  const trainees = traineesRes.data ?? [];
  const total_trainees = trainees.length;
  const active_trainees = trainees.filter(
    (t) => t.training_status !== "inactive"
  ).length;

  // Counts
  const total_programs = programsRes.data?.length ?? 0;
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

  // Top programs should reflect real learner progress, not the legacy
  // program_enrollments helper table. `user_program_progress` is the
  // authoritative per-user/per-program cache for started/completed state.
  const programRows = programsRes.data ?? [];
  const programNameById = new Map(programRows.map((p) => [p.id, p.name]));
  const programProgressRows = programProgressRes.data ?? [];
  const topProgramMap = new Map<
    string,
    { started: number; completed: number; progressTotal: number; progressSamples: number }
  >();

  for (const row of programProgressRows) {
    if (!topProgramMap.has(row.program_id)) {
      topProgramMap.set(row.program_id, {
        started: 0,
        completed: 0,
        progressTotal: 0,
        progressSamples: 0,
      });
    }
    const entry = topProgramMap.get(row.program_id)!;
    if (row.started_at) entry.started += 1;
    if (row.completed_at) entry.completed += 1;
    if (typeof row.progress_pct === "number") {
      entry.progressTotal += row.progress_pct;
      entry.progressSamples += 1;
    }
  }

  const top_programs = [...topProgramMap.entries()]
    .map(([id, stats]) => {
      const completion_rate =
        stats.started > 0
          ? Math.round((stats.completed / stats.started) * 1000) / 10
          : 0;
      const avg_progress_pct =
        stats.progressSamples > 0
          ? Math.round((stats.progressTotal / stats.progressSamples) * 10) / 10
          : 0;
      return {
        id,
        title: programNameById.get(id) ?? "",
        started: stats.started,
        completed: stats.completed,
        completion_rate,
        avg_progress_pct,
      };
    })
    .filter((program) => program.started > 0)
    .sort((a, b) => {
      if (b.started !== a.started) return b.started - a.started;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 5);

  return NextResponse.json({
    total_trainees,
    active_trainees,
    total_programs,
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
