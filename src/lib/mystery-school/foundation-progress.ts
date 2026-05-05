/**
 * Mystery School Foundation — Training-backed progress helper.
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v3.md
 *   §2 Keep all Foundation progress in Training tables.
 *   §3 Update Mystery School admin progress to match Training.
 *
 * Foundation progress lives in the modern Training tables:
 *
 *   • Program       → training_programs (Mystery School Foundation)
 *   • Week          → training_categories
 *   • Lesson        → training_lessons
 *   • Lesson done   → lesson_completions
 *   • Week done     → category_completions
 *
 * The legacy `student_foundation_progress` table is deprecated for new
 * Foundation work, but is kept readable so legacy rows can still be
 * surfaced in admin views as a fallback.
 *
 * All functions in this file:
 *   • Use the admin Supabase client (RLS-bypassing) so they can run from
 *     server route handlers that already enforce auth at the boundary.
 *   • Are read-only.
 *   • Return shapes that the existing Mystery School admin UI can consume
 *     without a schema change.
 *   • Never throw on a missing program — they return a "program absent"
 *     status so the caller can surface a setup state to the admin.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const MYSTERY_SCHOOL_FOUNDATION_PROGRAM_NAME =
  "Mystery School Foundation";

export interface FoundationCategorySummary {
  id: string;
  name: string;
  priority: number;
  is_active: boolean;
  active_lesson_count: number;
}

export interface FoundationProgramShape {
  program_present: boolean;
  program_id: string | null;
  program_name: string | null;
  /** Active week categories for the program, sorted by priority. */
  categories: FoundationCategorySummary[];
  /** All active category IDs (helper for downstream queries). */
  active_category_ids: string[];
  /** All active lesson IDs across active categories. */
  active_lesson_ids: string[];
}

export interface PerStudentFoundationProgress {
  /** Number of completed weeks (categories) for this user. */
  weeks_completed: number;
  /** Number of completed lessons for this user across the program. */
  lessons_completed: number;
}

/**
 * Locate the Mystery School Foundation program plus its active categories
 * and lessons. Returns a structured shape consumed by the helpers below.
 *
 * On a missing/inactive program, returns
 *   { program_present: false, ... empty arrays ... }
 * so callers can fall back to a setup state.
 */
export async function loadFoundationProgramShape(
  admin: SupabaseClient
): Promise<FoundationProgramShape> {
  const { data: program } = await admin
    .from("training_programs")
    .select("id, name, is_active")
    .eq("name", MYSTERY_SCHOOL_FOUNDATION_PROGRAM_NAME)
    .eq("is_active", true)
    .maybeSingle();

  if (!program) {
    return {
      program_present: false,
      program_id: null,
      program_name: null,
      categories: [],
      active_category_ids: [],
      active_lesson_ids: [],
    };
  }

  const { data: categories } = await admin
    .from("training_categories")
    .select("id, name, priority, is_active")
    .eq("training_id", program.id)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  const categoryRows = (categories ?? []) as Array<{
    id: string;
    name: string;
    priority: number;
    is_active: boolean;
  }>;

  const activeCategoryIds = categoryRows.map((c) => c.id);

  const lessonsResult = activeCategoryIds.length
    ? await admin
        .from("training_lessons")
        .select("id, category_id, is_active")
        .in("category_id", activeCategoryIds)
        .eq("is_active", true)
    : { data: [] as Array<{ id: string; category_id: string; is_active: boolean }> };
  const lessons = lessonsResult.data;

  const lessonRows = (lessons ?? []) as Array<{
    id: string;
    category_id: string;
    is_active: boolean;
  }>;

  const lessonsPerCategory = new Map<string, number>();
  for (const lesson of lessonRows) {
    lessonsPerCategory.set(
      lesson.category_id,
      (lessonsPerCategory.get(lesson.category_id) ?? 0) + 1
    );
  }

  const summaries: FoundationCategorySummary[] = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    priority: c.priority,
    is_active: c.is_active,
    active_lesson_count: lessonsPerCategory.get(c.id) ?? 0,
  }));

  return {
    program_present: true,
    program_id: program.id,
    program_name: program.name,
    categories: summaries,
    active_category_ids: activeCategoryIds,
    active_lesson_ids: lessonRows.map((l) => l.id),
  };
}

/**
 * Per-user Foundation progress from Training tables. Returns a Map keyed by
 * user_id, including users with zero progress so the admin UI can render a
 * `0/12` state without a separate left-join.
 *
 * If the Foundation program is absent, all users are reported as zero.
 */
export async function getFoundationProgressByUserId(
  admin: SupabaseClient,
  userIds: string[]
): Promise<{
  shape: FoundationProgramShape;
  byUserId: Map<string, PerStudentFoundationProgress>;
}> {
  const shape = await loadFoundationProgramShape(admin);

  const byUserId = new Map<string, PerStudentFoundationProgress>();
  for (const id of userIds) {
    byUserId.set(id, { weeks_completed: 0, lessons_completed: 0 });
  }

  if (!shape.program_present || userIds.length === 0) {
    return { shape, byUserId };
  }

  // Two batched queries scoped to this program's active categories/lessons.
  // Both are filtered by user_id IN (...) so the RLS-bypassing admin client
  // does not leak unrelated users' completion rows into the response.
  const [categoryCompletionsRes, lessonCompletionsRes] = await Promise.all([
    shape.active_category_ids.length
      ? admin
          .from("category_completions")
          .select("user_id, category_id")
          .in("user_id", userIds)
          .in("category_id", shape.active_category_ids)
      : Promise.resolve({
          data: [] as Array<{ user_id: string; category_id: string }>,
          error: null,
        }),
    shape.active_lesson_ids.length
      ? admin
          .from("lesson_completions")
          .select("user_id, lesson_id")
          .in("user_id", userIds)
          .in("lesson_id", shape.active_lesson_ids)
      : Promise.resolve({
          data: [] as Array<{ user_id: string; lesson_id: string }>,
          error: null,
        }),
  ]);

  for (const row of (categoryCompletionsRes.data ?? []) as Array<{
    user_id: string;
    category_id: string;
  }>) {
    const cur = byUserId.get(row.user_id);
    if (cur) cur.weeks_completed += 1;
  }
  for (const row of (lessonCompletionsRes.data ?? []) as Array<{
    user_id: string;
    lesson_id: string;
  }>) {
    const cur = byUserId.get(row.user_id);
    if (cur) cur.lessons_completed += 1;
  }

  return { shape, byUserId };
}

/**
 * Per-week (category) completion timeline for a single user. Used by the
 * admin student-detail view to show which Foundation weeks are complete
 * and when. Returns one entry per active category in priority order.
 */
export interface FoundationWeekTimelineEntry {
  category_id: string;
  week_number: number;
  title: string;
  active_lesson_count: number;
  lessons_completed: number;
  category_completed_at: string | null;
  /** True when category_completions has a row OR every active lesson is done. */
  completed: boolean;
}

export async function getFoundationWeekTimelineForUser(
  admin: SupabaseClient,
  userId: string
): Promise<{
  shape: FoundationProgramShape;
  weeks: FoundationWeekTimelineEntry[];
}> {
  const shape = await loadFoundationProgramShape(admin);
  if (!shape.program_present) {
    return { shape, weeks: [] };
  }

  const [categoryCompletionsRes, lessonCompletionsRes, lessonsRes] =
    await Promise.all([
      shape.active_category_ids.length
        ? admin
            .from("category_completions")
            .select("category_id, completed_at")
            .eq("user_id", userId)
            .in("category_id", shape.active_category_ids)
        : Promise.resolve({
            data: [] as Array<{
              category_id: string;
              completed_at: string | null;
            }>,
            error: null,
          }),
      shape.active_lesson_ids.length
        ? admin
            .from("lesson_completions")
            .select("lesson_id")
            .eq("user_id", userId)
            .in("lesson_id", shape.active_lesson_ids)
        : Promise.resolve({
            data: [] as Array<{ lesson_id: string }>,
            error: null,
          }),
      shape.active_category_ids.length
        ? admin
            .from("training_lessons")
            .select("id, category_id")
            .in("category_id", shape.active_category_ids)
            .eq("is_active", true)
        : Promise.resolve({
            data: [] as Array<{ id: string; category_id: string }>,
            error: null,
          }),
    ]);

  const completedAtByCategory = new Map<string, string | null>(
    ((categoryCompletionsRes.data ?? []) as Array<{
      category_id: string;
      completed_at: string | null;
    }>).map((row) => [row.category_id, row.completed_at ?? null])
  );

  const completedLessonIds = new Set(
    ((lessonCompletionsRes.data ?? []) as Array<{ lesson_id: string }>).map(
      (row) => row.lesson_id
    )
  );

  const lessonsByCategory = new Map<string, string[]>();
  for (const row of (lessonsRes.data ?? []) as Array<{
    id: string;
    category_id: string;
  }>) {
    const arr = lessonsByCategory.get(row.category_id) ?? [];
    arr.push(row.id);
    lessonsByCategory.set(row.category_id, arr);
  }

  const weeks: FoundationWeekTimelineEntry[] = shape.categories.map(
    (category, idx) => {
      const lessonIds = lessonsByCategory.get(category.id) ?? [];
      const lessonsCompleted = lessonIds.filter((id) =>
        completedLessonIds.has(id)
      ).length;
      const categoryCompletedAt =
        completedAtByCategory.get(category.id) ?? null;
      const allLessonsDone =
        lessonIds.length > 0 && lessonsCompleted >= lessonIds.length;
      return {
        category_id: category.id,
        week_number: category.priority || idx + 1,
        title: category.name,
        active_lesson_count: lessonIds.length,
        lessons_completed: lessonsCompleted,
        category_completed_at: categoryCompletedAt,
        completed: !!categoryCompletedAt || allLessonsDone,
      };
    }
  );

  return { shape, weeks };
}
