import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/trainee/training/programs
 * Returns all programs the current user has access to, with full hierarchy:
 *   programs → categories → lessons (with completion + quiz status per user)
 * Each category includes: completed flag, progress (x/total)
 * Each program includes: overall progress percentage
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
    .select("id, name, description, priority, allowed_roles")
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
    .select("id, name, description, priority, training_id")
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

  // ── 5. Fetch user's completion + quiz status ───────────────────────────────
  const [completionsResult, quizAttemptsResult, categoryCompletionsResult] =
    await Promise.all([
      lessonIds.length > 0
        ? admin
            .from("lesson_completions")
            .select("lesson_id")
            .eq("user_id", user.id)
            .in("lesson_id", lessonIds)
        : Promise.resolve({ data: [] as { lesson_id: string }[], error: null }),
      lessonIds.length > 0
        ? admin
            .from("quiz_attempts")
            .select("lesson_id, passed")
            .eq("user_id", user.id)
            .in("lesson_id", lessonIds)
            .order("attempted_at", { ascending: false })
        : Promise.resolve(
            {
              data: [] as { lesson_id: string; passed: boolean }[],
              error: null,
            }
          ),
      categoryIds.length > 0
        ? admin
            .from("category_completions")
            .select("category_id")
            .eq("user_id", user.id)
            .in("category_id", categoryIds)
        : Promise.resolve(
            { data: [] as { category_id: string }[], error: null }
          ),
    ]);

  const completedLessons = new Set(
    (completionsResult.data ?? []).map((r) => r.lesson_id)
  );

  // For each lesson, keep only the most recent quiz attempt's pass status
  const quizPassMap = new Map<string, boolean>();
  for (const attempt of completionsResult.data ?? []) {
    // quiz_attempts rows — we only need "passed" per lesson_id (latest first from ORDER BY)
    if (!quizPassMap.has(attempt.lesson_id)) {
      // completionsResult has no "passed" — use quizAttemptsResult
    }
  }
  for (const attempt of quizAttemptsResult.data ?? []) {
    if (!quizPassMap.has(attempt.lesson_id)) {
      quizPassMap.set(attempt.lesson_id, attempt.passed);
    }
  }

  const completedCategories = new Set(
    (categoryCompletionsResult.data ?? []).map((r) => r.category_id)
  );

  // ── 6. Assemble hierarchy ──────────────────────────────────────────────────
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

  let totalProgramLessons = 0;
  let totalProgramCompleted = 0;

  const result = accessiblePrograms.map((prog) => {
    const progCategories = categoriesByProgram.get(prog.id) ?? [];
    let progTotal = 0;
    let progCompleted = 0;

    const enrichedCategories = progCategories.map((cat) => {
      const catLessons = lessonsByCategory.get(cat.id) ?? [];
      const total = catLessons.length;
      const completedCount = catLessons.filter((l) =>
        completedLessons.has(l.id)
      ).length;

      progTotal += total;
      progCompleted += completedCount;

      const enrichedLessons = catLessons.map((l) => ({
        id: l.id,
        title: l.title,
        priority: l.priority,
        is_active: l.is_active,
        previous_lesson_id: l.previous_lesson_id,
        completed: completedLessons.has(l.id),
        quiz_passed: quizPassMap.get(l.id) ?? null,
      }));

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        priority: cat.priority,
        completed: completedCategories.has(cat.id),
        progress: { completed: completedCount, total },
        lessons: enrichedLessons,
      };
    });

    totalProgramLessons += progTotal;
    totalProgramCompleted += progCompleted;

    const progressPct =
      progTotal > 0 ? Math.round((progCompleted / progTotal) * 100) : 0;

    return {
      id: prog.id,
      name: prog.name,
      description: prog.description,
      priority: prog.priority,
      progress: progressPct,
      categories: enrichedCategories,
    };
  });

  return NextResponse.json({ programs: result });
}
