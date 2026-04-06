import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/analytics/categories
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const programIdFilter = sp.get("program_id")?.trim() ?? null;

  const admin = createAdminClient();

  // Fetch categories — training_categories uses training_id as FK to training_programs
  let categoriesQuery = admin
    .from("training_categories")
    .select("id, name, training_id, is_active, created_at")
    .order("created_at", { ascending: false });

  if (programIdFilter) {
    categoriesQuery = categoriesQuery.eq("training_id", programIdFilter);
  }

  const [categoriesRes, programsRes] = await Promise.all([
    categoriesQuery,
    admin.from("training_programs").select("id, name"),
  ]);

  const categories = categoriesRes.data ?? [];
  const programs = programsRes.data ?? [];

  if (categories.length === 0) {
    return NextResponse.json({ categories: [] });
  }

  const programNameMap = new Map(
    programs.map((p: { id: string; name: string }) => [p.id, p.name])
  );
  const categoryIds = categories.map((c) => c.id);

  // Fetch lessons, completions, and progress for these categories in parallel
  const [lessonsRes, categoryCompletionsRes, lessonProgressRes] =
    await Promise.all([
      admin
        .from("training_lessons")
        .select("id, category_id")
        .in("category_id", categoryIds)
        .eq("is_active", true),
      admin
        .from("category_completions")
        .select("category_id, user_id, time_spent_seconds")
        .in("category_id", categoryIds),
      admin
        .from("lesson_progress")
        .select("user_id, lesson_id, time_spent_seconds"),
    ]);

  const lessons = lessonsRes.data ?? [];
  const categoryCompletions = categoryCompletionsRes.data ?? [];
  const lessonProgress = lessonProgressRes.data ?? [];

  // Build lesson_id -> category_id lookup
  const lessonToCategory = new Map<string, string>();
  for (const l of lessons) {
    lessonToCategory.set(l.id, l.category_id);
  }

  // Count lessons per category
  const categoryLessonCount = new Map<string, number>();
  for (const l of lessons) {
    categoryLessonCount.set(
      l.category_id,
      (categoryLessonCount.get(l.category_id) ?? 0) + 1
    );
  }

  // Aggregate category completions
  const categoryCompletionStats = new Map<
    string,
    { completions: number; total_time: number }
  >();
  for (const cc of categoryCompletions) {
    if (!categoryCompletionStats.has(cc.category_id)) {
      categoryCompletionStats.set(cc.category_id, {
        completions: 0,
        total_time: 0,
      });
    }
    const stats = categoryCompletionStats.get(cc.category_id)!;
    stats.completions += 1;
    stats.total_time += cc.time_spent_seconds ?? 0;
  }

  // Unique users who started in each category (via lesson_progress -> lesson -> category)
  const categoryStartedUsers = new Map<string, Set<string>>();
  for (const lp of lessonProgress) {
    const catId = lessonToCategory.get(lp.lesson_id);
    if (!catId || !categoryIds.includes(catId)) continue;
    if (!categoryStartedUsers.has(catId)) {
      categoryStartedUsers.set(catId, new Set());
    }
    categoryStartedUsers.get(catId)!.add(lp.user_id);
  }

  const result = categories.map((c) => {
    const completionStats = categoryCompletionStats.get(c.id) ?? {
      completions: 0,
      total_time: 0,
    };
    const unique_users_started = categoryStartedUsers.get(c.id)?.size ?? 0;
    const user_completions = completionStats.completions;
    const completion_rate =
      unique_users_started > 0
        ? Math.round((user_completions / unique_users_started) * 1000) / 10
        : 0;
    const avg_time_spent_seconds =
      user_completions > 0
        ? Math.round(completionStats.total_time / user_completions)
        : 0;

    return {
      id: c.id,
      title: c.name,
      program_id: c.training_id,
      program_title: programNameMap.get(c.training_id) ?? "",
      total_lessons: categoryLessonCount.get(c.id) ?? 0,
      user_completions,
      unique_users_started,
      completion_rate,
      avg_time_spent_seconds,
      created_at: c.created_at,
    };
  });

  return NextResponse.json({ categories: result });
}
