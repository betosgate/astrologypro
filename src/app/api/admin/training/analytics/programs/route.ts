import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/analytics/programs
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch all programs with their categories and lessons counts, enrollments, and quiz attempts
  const [
    programsRes,
    categoriesRes,
    lessonsRes,
    enrollmentsRes,
    quizAttemptsRes,
  ] = await Promise.all([
    admin
      .from("training_programs")
      .select("id, name, is_active, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("training_categories")
      .select("id, training_id")
      .eq("is_active", true),
    admin
      .from("training_lessons")
      .select("id, category_id")
      .eq("is_active", true),
    admin
      .from("program_enrollments")
      .select("program_id, completed_at, time_spent_seconds"),
    admin.from("quiz_attempts").select("lesson_id, passed"),
  ]);

  const programs = programsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const lessons = lessonsRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const quizAttempts = quizAttemptsRes.data ?? [];

  // Build lookup: category_id -> training_id (program_id)
  const categoryToProgram = new Map<string, string>();
  for (const cat of categories) {
    categoryToProgram.set(cat.id, cat.training_id);
  }

  // Build lookup: lesson_id -> program_id (via category)
  const lessonToProgram = new Map<string, string>();
  for (const lesson of lessons) {
    const programId = categoryToProgram.get(lesson.category_id);
    if (programId) lessonToProgram.set(lesson.id, programId);
  }

  // Aggregate categories and lessons per program
  const programCategoryCount = new Map<string, number>();
  for (const cat of categories) {
    programCategoryCount.set(
      cat.training_id,
      (programCategoryCount.get(cat.training_id) ?? 0) + 1
    );
  }

  const programLessonCount = new Map<string, number>();
  for (const lesson of lessons) {
    const programId = categoryToProgram.get(lesson.category_id);
    if (programId) {
      programLessonCount.set(programId, (programLessonCount.get(programId) ?? 0) + 1);
    }
  }

  // Aggregate enrollments per program
  const programEnrollments = new Map<
    string,
    { enrolled: number; completed: number; total_time: number }
  >();
  for (const e of enrollments) {
    if (!programEnrollments.has(e.program_id)) {
      programEnrollments.set(e.program_id, {
        enrolled: 0,
        completed: 0,
        total_time: 0,
      });
    }
    const entry = programEnrollments.get(e.program_id)!;
    entry.enrolled += 1;
    if (e.completed_at) entry.completed += 1;
    if (e.time_spent_seconds) entry.total_time += e.time_spent_seconds;
  }

  // Aggregate quiz pass rate per program (via lesson -> program mapping)
  const programQuizStats = new Map<
    string,
    { attempts: number; passed: number }
  >();
  for (const qa of quizAttempts) {
    const programId = lessonToProgram.get(qa.lesson_id);
    if (!programId) continue;
    if (!programQuizStats.has(programId)) {
      programQuizStats.set(programId, { attempts: 0, passed: 0 });
    }
    const stats = programQuizStats.get(programId)!;
    stats.attempts += 1;
    if (qa.passed) stats.passed += 1;
  }

  const result = programs.map((p) => {
    const enrollData = programEnrollments.get(p.id) ?? {
      enrolled: 0,
      completed: 0,
      total_time: 0,
    };
    const quizStats = programQuizStats.get(p.id) ?? { attempts: 0, passed: 0 };
    const enrolled_count = enrollData.enrolled;
    const completed_count = enrollData.completed;
    const completion_rate =
      enrolled_count > 0
        ? Math.round((completed_count / enrolled_count) * 1000) / 10
        : 0;
    const avg_time_spent_seconds =
      enrolled_count > 0
        ? Math.round(enrollData.total_time / enrolled_count)
        : 0;
    const avg_quiz_pass_rate =
      quizStats.attempts > 0
        ? Math.round((quizStats.passed / quizStats.attempts) * 1000) / 10
        : 0;

    return {
      id: p.id,
      title: p.name,
      is_active: p.is_active,
      total_categories: programCategoryCount.get(p.id) ?? 0,
      total_lessons: programLessonCount.get(p.id) ?? 0,
      enrolled_count,
      completed_count,
      completion_rate,
      avg_time_spent_seconds,
      avg_quiz_pass_rate,
      created_at: p.created_at,
    };
  });

  return NextResponse.json({ programs: result });
}
