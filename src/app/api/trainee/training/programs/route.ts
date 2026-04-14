import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/trainee/training/programs
 * Returns all programs the current user has access to, with full hierarchy:
 *   programs → categories → lessons (with completion + quiz status per user)
 *
 * Progress data is sourced from the cache tables:
 *   user_program_progress  (one row per user+program)
 *   user_category_progress (one row per user+category)
 *
 * Both tables are populated/updated automatically via DB triggers on
 * lesson_completions, training_lessons, and training_categories changes.
 * If no cache row exists (user has not started), zeroed defaults are returned
 * without triggering recalculation — the trigger handles it on first activity.
 *
 * Query cost: 2 cache queries (batch, not N+1) + existing lesson/completion
 * queries already present in the previous implementation.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ── 1. Resolve the user's role slugs ──────────────────────────────────────
  const [traineeRow, divinerRow, communityRows, advocateRow, affiliateRow] =
    await Promise.all([
      admin.from("trainees").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("diviners").select("id").eq("user_id", user.id).maybeSingle(),
      admin
        .from("community_members")
        .select("membership_type")
        .eq("user_id", user.id),
      admin
        .from("social_advocates")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("affiliates")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const userSlugs: string[] = [];
  if (traineeRow.data) userSlugs.push("is_trainee");
  if (divinerRow.data) userSlugs.push("is_astrologer");
  if (advocateRow.data) userSlugs.push("is_social_advo");
  if (affiliateRow.data) userSlugs.push("is_affiliate");
  for (const communityRow of communityRows.data ?? []) {
    if (communityRow.membership_type === "mystery_school")
      userSlugs.push("is_mystery_school");
    if (communityRow.membership_type === "perennial_mandalism")
      userSlugs.push("is_Perennial_Mandalism");
  }

  // ── 2. Fetch all active programs ──────────────────────────────────────────
  const { data: programs, error: programsError } = await admin
    .from("training_programs")
    .select("id, name, description, priority, is_active, allowed_roles, is_sequential")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (programsError) {
    return NextResponse.json(
      { error: programsError.message },
      { status: 500 }
    );
  }

  // Filter by role access
  const accessiblePrograms = (programs ?? []).filter((prog) => {
    const allowed: string[] = prog.allowed_roles ?? [];
    if (allowed.length === 0) return true;
    return [...new Set(userSlugs)].some((s) => allowed.includes(s));
  });

  if (accessiblePrograms.length === 0) {
    return NextResponse.json({ programs: [] });
  }

  const programIds = accessiblePrograms.map((p) => p.id);

  // ── 3. Fetch categories for accessible programs ───────────────────────────
  const { data: categories, error: catError } = await admin
    .from("training_categories")
    .select("id, name, description, priority, is_active, training_id, is_sequential")
    .in("training_id", programIds)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  const categoryIds = (categories ?? []).map((c) => c.id);

  // ── 4. Fetch lessons for those categories ─────────────────────────────────
  const { data: lessons, error: lessonError } =
    categoryIds.length > 0
      ? await admin
        .from("training_lessons")
        .select(
          "id, category_id, title, priority, is_active, previous_lesson_id"
        )
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .order("priority", { ascending: true })
      : { data: [], error: null };

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  const lessonIds = (lessons ?? []).map((l) => l.id);

  // ── 5. Fetch user's completion + quiz status + progress cache ─────────────
  // All six queries run in parallel. The cache queries are batch fetches
  // (one per table) — not N+1.
  const [
    completionsResult,
    quizAttemptsResult,
    categoryCompletionsResult,
    programCacheResult,
    categoryCacheResult,
    lessonInProgressResult,
  ] = await Promise.all([
    // Lesson-level completion flags (for per-lesson "completed" boolean)
    lessonIds.length > 0
      ? admin
        .from("lesson_completions")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as { lesson_id: string }[], error: null }),

    // Quiz pass/fail per lesson (latest attempt, ordered descending)
    lessonIds.length > 0
      ? admin
        .from("quiz_attempts")
        .select("lesson_id, passed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
        .order("attempted_at", { ascending: false })
      : Promise.resolve(
        { data: [] as { lesson_id: string; passed: boolean }[], error: null }
      ),

    // Category-level completion flags
    categoryIds.length > 0
      ? admin
        .from("category_completions")
        .select("category_id")
        .eq("user_id", user.id)
        .in("category_id", categoryIds)
      : Promise.resolve(
        { data: [] as { category_id: string }[], error: null }
      ),

    // Batch: all program-level progress cache rows for this user
    programIds.length > 0
      ? admin
        .from("user_program_progress")
        .select(
          "program_id, total_lessons, completed_lessons, total_categories, completed_categories, progress_pct, started_at, last_activity_at, completed_at, next_lesson_id, next_lesson_title, next_category_id, next_category_name"
        )
        .eq("user_id", user.id)
        .in("program_id", programIds)
      : Promise.resolve({
        data: [] as {
          program_id: string;
          total_lessons: number;
          completed_lessons: number;
          total_categories: number;
          completed_categories: number;
          progress_pct: number;
          started_at: string | null;
          last_activity_at: string | null;
          completed_at: string | null;
          next_lesson_id: string | null;
          next_lesson_title: string | null;
          next_category_id: string | null;
          next_category_name: string | null;
        }[],
        error: null,
      }),

    // Batch: all category-level progress cache rows for this user
    categoryIds.length > 0
      ? admin
        .from("user_category_progress")
        .select(
          "category_id, total_lessons, completed_lessons, progress_pct, started_at, last_activity_at, completed_at, next_lesson_id, next_lesson_title"
        )
        .eq("user_id", user.id)
        .in("category_id", categoryIds)
      : Promise.resolve({
        data: [] as {
          category_id: string;
          total_lessons: number;
          completed_lessons: number;
          progress_pct: number;
          started_at: string | null;
          last_activity_at: string | null;
          completed_at: string | null;
          next_lesson_id: string | null;
          next_lesson_title: string | null;
        }[],
        error: null,
      }),

    // Batch: lessons that are in progress — started but not completed. Used
    // by the program workspace (Module 02) to light up the Ongoing status
    // badge alongside Not Started / Completed. Without this the workspace
    // only ever shows Not Started or Completed because nothing else
    // populated lesson.in_progress.
    lessonIds.length > 0
      ? admin
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .not("started_at", "is", null)
        .is("completed_at", null)
        .in("lesson_id", lessonIds)
      : Promise.resolve({
        data: [] as { lesson_id: string }[],
        error: null,
      }),
  ]);

  // ── 5b. Fetch global sequential lock setting ─────────────────────────────
  const { data: trainingSettings } = await admin
    .from("training_settings")
    .select("global_sequential_lock")
    .limit(1)
    .maybeSingle();

  // If global_sequential_lock = false (or not set), bypass all sequential enforcement
  const globalLock = trainingSettings?.global_sequential_lock ?? false;

  // ── 6. Build lookup maps ───────────────────────────────────────────────────

  const completedLessons = new Set(
    (completionsResult.data ?? []).map((r) => r.lesson_id)
  );

  // Keep only the most recent quiz attempt's pass status per lesson
  const quizPassMap = new Map<string, boolean>();
  for (const attempt of quizAttemptsResult.data ?? []) {
    if (!quizPassMap.has(attempt.lesson_id)) {
      quizPassMap.set(attempt.lesson_id, attempt.passed);
    }
  }

  const completedCategories = new Set(
    (categoryCompletionsResult.data ?? []).map((r) => r.category_id)
  );

  // Lessons the learner has started but not completed (from lesson_progress).
  // Drives the Ongoing status badge in the program workspace. A lesson that
  // is in this set AND also in completedLessons is resolved as Completed at
  // the assembly step below.
  const inProgressLessons = new Set(
    (lessonInProgressResult.data ?? []).map((r) => r.lesson_id)
  );

  // Index cache rows by their FK for O(1) lookup during assembly
  const programCacheMap = new Map(
    (programCacheResult.data ?? []).map((r) => [r.program_id, r])
  );
  const categoryCacheMap = new Map(
    (categoryCacheResult.data ?? []).map((r) => [r.category_id, r])
  );

  // ── 7. Assemble lesson and category buckets ────────────────────────────────
  const lessonsByCategory = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    if (!lesson.category_id) continue;
    const bucket = lessonsByCategory.get(lesson.category_id) ?? [];
    bucket.push(lesson);
    lessonsByCategory.set(lesson.category_id, bucket);
  }

  const categoriesByProgram = new Map<string, typeof categories>();
  for (const cat of categories ?? []) {
    const bucket = categoriesByProgram.get(cat.training_id) ?? [];
    bucket.push(cat);
    categoriesByProgram.set(cat.training_id, bucket);
  }

  // ── 8. Assemble final response ─────────────────────────────────────────────
  const result = accessiblePrograms.map((prog) => {
    const progCategories = categoriesByProgram.get(prog.id) ?? [];
    const progCache = programCacheMap.get(prog.id) ?? null;
    const isCategoryComplete = (categoryId: string) => {
      const categoryLessons = lessonsByCategory.get(categoryId) ?? [];
      if (completedCategories.has(categoryId)) return true;
      return (
        categoryLessons.length > 0 &&
        categoryLessons.every((lesson) => completedLessons.has(lesson.id))
      );
    };
    const nextCategoryId = progCache?.next_category_id ?? null;
    const effectiveNextCategoryId =
      nextCategoryId ??
      progCategories.find((cat) => !isCategoryComplete(cat.id))?.id ??
      null;

    const enrichedCategories = progCategories.map((cat) => {
      const catLessons = lessonsByCategory.get(cat.id) ?? [];
      const catCache = categoryCacheMap.get(cat.id) ?? null;
      const derivedTotalLessons = catLessons.length;
      const derivedCompletedLessons = catLessons.filter((lesson) =>
        completedLessons.has(lesson.id),
      ).length;
      const derivedProgressPct =
        derivedTotalLessons > 0
          ? Math.round((derivedCompletedLessons / derivedTotalLessons) * 100)
          : 0;
      const catCompleted = isCategoryComplete(cat.id);
      const nextLessonId = catCache?.next_lesson_id ?? null;
      const effectiveNextLessonId =
        nextLessonId ??
        catLessons.find((lesson) => !completedLessons.has(lesson.id))?.id ??
        null;

      // ── Category sequential lock ─────────────────────────────────────────
      // A category is locked when:
      //   - global_sequential_lock is ON
      //   - the program is sequential
      //   - this category is not completed
      //   - it is not the immediate next one
      //   - there is at least one lower-priority category that is not yet completed
      const isCatLocked =
        globalLock &&
        !!(prog as { is_sequential?: boolean }).is_sequential &&
        !catCompleted &&
        cat.id !== (effectiveNextCategoryId ?? cat.id) &&
        progCategories.some(
          (c) =>
            c.training_id === prog.id &&
            c.priority < cat.priority &&
            c.is_active &&
            !completedCategories.has(c.id)
        );

      // ── Lesson assembly with sequential lock ─────────────────────────────
      const enrichedLessons = catLessons.map((l) => {
        const lessonCompleted = completedLessons.has(l.id);

        // A lesson is locked when:
        //   - global_sequential_lock is ON
        //   - the category is sequential
        //   - it is not completed
        //   - it is not the immediate next lesson for this category
        //   - there is at least one lower-priority incomplete lesson before it
        const isLessonLocked =
          globalLock &&
          !lessonCompleted &&
          !!(cat as { is_sequential?: boolean }).is_sequential &&
          l.id !== (effectiveNextLessonId ?? l.id) &&
          catLessons.some(
            (prev) =>
              prev.priority < l.priority &&
              prev.is_active &&
              !completedLessons.has(prev.id)
          );

        return {
          id: l.id,
          title: l.title,
          priority: l.priority,
          is_active: l.is_active,
          previous_lesson_id: l.previous_lesson_id,
          completed: lessonCompleted,
          // "Ongoing" = started but not yet completed. Mutually exclusive
          // with `completed` by construction. Used by ProgramWorkspace to
          // light up the amber "Ongoing" status badge.
          in_progress: !lessonCompleted && inProgressLessons.has(l.id),
          quiz_passed: quizPassMap.get(l.id) ?? null,
          is_locked: isLessonLocked,
          lock_reason: isLessonLocked
            ? "Complete the previous lesson first to continue in sequence."
            : null,
        };
      });

      return {
        id: cat.id,
        name: cat.name,
        priority: cat.priority,
        is_active: cat.is_active,
        is_sequential: !!(cat as { is_sequential?: boolean }).is_sequential,
        // Legacy completion flag kept for backward compat with existing UI
        completed: catCompleted,
        is_locked: isCatLocked,
        lock_reason: isCatLocked
          ? "Complete the previous category first to unlock this section."
          : null,
        // Hierarchy-derived counts are authoritative for learner-facing UI.
        // Cache rows can become stale when lessons/categories are edited.
        progress_pct: derivedProgressPct,
        completed_lessons: derivedCompletedLessons,
        total_lessons: derivedTotalLessons,
        started_at: catCache?.started_at ?? null,
        last_activity_at: catCache?.last_activity_at ?? null,
        completed_at: catCache?.completed_at ?? null,
        next_lesson_id: effectiveNextLessonId,
        next_lesson_title:
          catCache?.next_lesson_title ??
          catLessons.find((lesson) => lesson.id === effectiveNextLessonId)
            ?.title ??
          null,
        lessons: enrichedLessons,
      };
    });

    // Fallback totals derived from the already-fetched active hierarchy.
    // Used only when the user_program_progress cache row is missing (i.e.
    // the learner has never started this program). Without this fallback,
    // unstarted program cards would render "0 lessons" and "0/0 lessons
    // complete", which misrepresents the real accessible workload — see
    // tasks/09.04.2026/admin-module/training-school/02-learner-experience/
    // 01-fix-unstarted-program-card-total-lesson-count.md.
    const derivedTotalLessons = enrichedCategories.reduce(
      (sum, c) => sum + (c.total_lessons ?? 0),
      0,
    );
    const derivedCompletedLessons = enrichedCategories.reduce(
      (sum, c) => sum + (c.completed_lessons ?? 0),
      0,
    );
    const derivedProgressPct =
      derivedTotalLessons > 0
        ? Math.round((derivedCompletedLessons / derivedTotalLessons) * 100)
        : 0;
    const derivedCompletedCategories = enrichedCategories.filter(
      (category) => category.completed,
    ).length;

    return {
      id: prog.id,
      name: prog.name,
      description: prog.description ?? null,
      priority: prog.priority,
      is_active: prog.is_active,
      is_sequential: !!(prog as { is_sequential?: boolean }).is_sequential,
      allowed_roles: prog.allowed_roles ?? [],
      // Hierarchy-derived counts are authoritative for cards/workspace. Cache
      // rows are retained below only for activity timestamps and next hints.
      progress_pct: derivedProgressPct,
      completed_lessons: derivedCompletedLessons,
      total_lessons: derivedTotalLessons,
      completed_categories: derivedCompletedCategories,
      total_categories: progCategories.length,
      started_at: progCache?.started_at ?? null,
      last_activity_at: progCache?.last_activity_at ?? null,
      completed_at: progCache?.completed_at ?? null,
      next_lesson_id: progCache?.next_lesson_id ?? null,
      next_lesson_title: progCache?.next_lesson_title ?? null,
      next_category_id: progCache?.next_category_id ?? null,
      next_category_name: progCache?.next_category_name ?? null,
      categories: enrichedCategories,
    };
  });

  return NextResponse.json({ programs: result });
}
