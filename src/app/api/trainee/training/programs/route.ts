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
  const [traineeRow, divinerRow, communityRow, advocateRow, affiliateRow] =
    await Promise.all([
      admin.from("trainees").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("diviners").select("id").eq("user_id", user.id).maybeSingle(),
      admin
        .from("community_members")
        .select("membership_type")
        .eq("user_id", user.id)
        .maybeSingle(),
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
  if (communityRow.data) {
    if (communityRow.data.membership_type === "mystery_school")
      userSlugs.push("is_mystery_school");
    if (communityRow.data.membership_type === "perennial_mandalism")
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
    return userSlugs.some((s) => allowed.includes(s));
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
  // All five queries run in parallel. The two cache queries are batch fetches
  // (one per table) — not N+1.
  const [
    completionsResult,
    quizAttemptsResult,
    categoryCompletionsResult,
    programCacheResult,
    categoryCacheResult,
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
    const nextCategoryId = progCache?.next_category_id ?? null;

    const enrichedCategories = progCategories.map((cat) => {
      const catLessons = lessonsByCategory.get(cat.id) ?? [];
      const catCache = categoryCacheMap.get(cat.id) ?? null;
      const catCompleted = completedCategories.has(cat.id);
      const nextLessonId = catCache?.next_lesson_id ?? null;

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
        cat.id !== (nextCategoryId ?? cat.id) &&
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
          l.id !== (nextLessonId ?? l.id) &&
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
          quiz_passed: quizPassMap.get(l.id) ?? null,
          is_locked: isLessonLocked,
          lock_reason: isLessonLocked
            ? "Complete previous lessons in order first"
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
          ? "Complete previous categories in order first"
          : null,
        // Cache-sourced progress fields
        progress_pct: catCache ? Number(catCache.progress_pct) : 0,
        completed_lessons: catCache ? catCache.completed_lessons : 0,
        total_lessons: catCache ? catCache.total_lessons : catLessons.length,
        started_at: catCache?.started_at ?? null,
        last_activity_at: catCache?.last_activity_at ?? null,
        completed_at: catCache?.completed_at ?? null,
        next_lesson_id: catCache?.next_lesson_id ?? null,
        next_lesson_title: catCache?.next_lesson_title ?? null,
        lessons: enrichedLessons,
      };
    });

    return {
      id: prog.id,
      name: prog.name,
      description: prog.description ?? null,
      priority: prog.priority,
      is_active: prog.is_active,
      is_sequential: !!(prog as { is_sequential?: boolean }).is_sequential,
      allowed_roles: prog.allowed_roles ?? [],
      // Cache-sourced progress fields; zeroed defaults when cache row absent
      progress_pct: progCache ? Number(progCache.progress_pct) : 0,
      completed_lessons: progCache ? progCache.completed_lessons : 0,
      total_lessons: progCache ? progCache.total_lessons : 0,
      completed_categories: progCache ? progCache.completed_categories : 0,
      total_categories: progCache ? progCache.total_categories : progCategories.length,
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
