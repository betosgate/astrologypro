import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/training/foundation
 *
 * Mystery School learner adapter built on top of the admin Training CMS.
 *
 * Reads the Mystery School Foundation curriculum from training_programs /
 * training_categories / training_lessons (seeded by migration
 * 20260504000002_mystery_school_foundation_seed) and presents it as the same
 * { weeks: [...] } shape that /api/mystery-school/training/page.tsx already
 * understands.
 *
 * Mapping:
 *   training_categories  → "weeks"  (priority is week_number, name is title)
 *   training_lessons     → "lessons" rendered inside each week
 *   lesson_completions   → per-lesson "completed" flag
 *   category_completions → per-week "completed" flag (alongside per-week
 *                          all-lessons-done derivation)
 *
 * Locking: week 1 is always unlocked; week N is unlocked when week N-1 has
 * either category_completions OR all of its lessons completed. This mirrors
 * the legacy unlock rule so learner UX does not regress.
 *
 * Graceful empty state: if the program does not exist yet (migration not
 * run, or admin renamed it), this route returns
 *   { weeks: [], total_weeks: 0, source: "training", program_present: false }
 * and the learner page falls back to the legacy /api/mystery-school/foundation
 * endpoint. No 500.
 */

const PROGRAM_NAME = "Mystery School Foundation";

type WeekLessonShape = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  duration_mins: number | null;
  priority: number;
  completed: boolean;
  completed_at: string | null;
};

type WeekShape = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  audio_url: string | null;
  beto_photo_url: string | null;
  unlocked: boolean;
  completed: boolean;
  completed_at: string | null;
  lessons: WeekLessonShape[];
  lessons_done: number;
  lessons_total: number;
};

export async function GET() {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json(
      { error: "Mystery School access required" },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = result.student as unknown as {
    id: string;
    training_status: string;
    enrolled_at: string;
    start_quarter: string;
    entry_quarter?: string | null;
  };

  const admin = createAdminClient();

  // ── 1. Locate the Mystery School Foundation program ────────────────────────
  const { data: program } = await admin
    .from("training_programs")
    .select("id, name, is_active, is_sequential, allowed_roles")
    .eq("name", PROGRAM_NAME)
    .eq("is_active", true)
    .maybeSingle();

  if (!program) {
    // Graceful empty: the legacy fallback should kick in on the client.
    return NextResponse.json({
      student: {
        id: student.id,
        status: student.training_status,
        enrolled_at: student.enrolled_at,
        start_quarter: student.start_quarter,
        entry_quarter:
          (student as Record<string, unknown>).entry_quarter ?? null,
      },
      weeks: [] as WeekShape[],
      total_weeks: 0,
      completed_count: 0,
      q1_complete: false,
      source: "training" as const,
      program_present: false,
    });
  }

  // ── 2. Categories (weeks) for this program ─────────────────────────────────
  const { data: categories, error: catError } = await admin
    .from("training_categories")
    .select("id, name, description, priority, is_active")
    .eq("training_id", program.id)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  const categoryList = categories ?? [];
  const categoryIds = categoryList.map((c) => c.id);

  // ── 3. Lessons across those categories (single batched fetch) ──────────────
  const { data: lessons } = categoryIds.length
    ? await admin
        .from("training_lessons")
        .select(
          "id, category_id, title, description, audio_url, video_url, pdf_url, duration_mins, priority, is_active"
        )
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .order("priority", { ascending: true })
    : { data: [] as Array<{
        id: string;
        category_id: string;
        title: string;
        description: string | null;
        audio_url: string | null;
        video_url: string | null;
        pdf_url: string | null;
        duration_mins: number | null;
        priority: number;
        is_active: boolean;
      }>, error: null };

  const lessonList = lessons ?? [];
  const lessonIds = lessonList.map((l) => l.id);

  // ── 4. Per-user completion state — three batched queries ───────────────────
  const [lessonCompletionsResult, categoryCompletionsResult] = await Promise.all([
    lessonIds.length
      ? admin
          .from("lesson_completions")
          .select("lesson_id, completed_at")
          .eq("user_id", user.id)
          .in("lesson_id", lessonIds)
      : Promise.resolve({
          data: [] as Array<{ lesson_id: string; completed_at: string | null }>,
          error: null,
        }),
    categoryIds.length
      ? admin
          .from("category_completions")
          .select("category_id, completed_at")
          .eq("user_id", user.id)
          .in("category_id", categoryIds)
      : Promise.resolve({
          data: [] as Array<{
            category_id: string;
            completed_at: string | null;
          }>,
          error: null,
        }),
  ]);

  const lessonCompletionByLessonId = new Map<string, string | null>(
    (lessonCompletionsResult.data ?? []).map((row) => [
      row.lesson_id,
      row.completed_at ?? null,
    ])
  );
  const categoryCompletionByCategoryId = new Map<string, string | null>(
    (categoryCompletionsResult.data ?? []).map((row) => [
      row.category_id,
      row.completed_at ?? null,
    ])
  );

  // ── 5. Group lessons by category and build week shapes ─────────────────────
  const lessonsByCategory = new Map<string, typeof lessonList>();
  for (const lesson of lessonList) {
    const arr = lessonsByCategory.get(lesson.category_id) ?? [];
    arr.push(lesson);
    lessonsByCategory.set(lesson.category_id, arr);
  }

  // For each category, derive: lessons_total, lessons_done, completed.
  // A week is "complete" when category_completions has a row OR every lesson
  // is marked complete (defensive — covers race between the two writes).
  const weekDerived = categoryList.map((category, idx) => {
    const catLessons = lessonsByCategory.get(category.id) ?? [];
    const lessonsShape: WeekLessonShape[] = catLessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? null,
      audio_url: l.audio_url ?? null,
      video_url: l.video_url ?? null,
      pdf_url: l.pdf_url ?? null,
      duration_mins: l.duration_mins ?? null,
      priority: l.priority,
      completed: lessonCompletionByLessonId.has(l.id),
      completed_at: lessonCompletionByLessonId.get(l.id) ?? null,
    }));

    const lessonsTotal = lessonsShape.length;
    const lessonsDone = lessonsShape.filter((l) => l.completed).length;

    const categoryCompletedAt = categoryCompletionByCategoryId.get(category.id);
    const allLessonsDone =
      lessonsTotal > 0 && lessonsDone >= lessonsTotal;
    const completed = !!categoryCompletedAt || allLessonsDone;

    // Use category.priority as the week_number so the UI's "Week N of 12"
    // labelling matches the seeded order even if names are renamed.
    const weekNumber = category.priority || idx + 1;

    return {
      category,
      week: {
        id: category.id,
        week_number: weekNumber,
        title: category.name,
        description: category.description ?? null,
        // Audio is stored on lessons in the new model; expose null at the
        // week level so the legacy AudioPlayer in the page is hidden — the
        // shared LessonViewerClient renders per-lesson audio instead.
        audio_url: null,
        beto_photo_url: null,
        unlocked: false, // computed below in sequential pass
        completed,
        completed_at: completed
          ? categoryCompletedAt ??
            lessonsShape.reduce<string | null>(
              (latest, l) =>
                l.completed_at && (!latest || l.completed_at > latest)
                  ? l.completed_at
                  : latest,
              null
            )
          : null,
        lessons: lessonsShape,
        lessons_done: lessonsDone,
        lessons_total: lessonsTotal,
      } as WeekShape,
    };
  });

  // ── 6. Sequential unlock — week 1 always; week N requires N-1 complete ────
  // Mirrors the legacy /api/mystery-school/foundation logic. We do this even
  // when the program is not flagged is_sequential because the Mystery School
  // learner UX has always presented week-by-week gating.
  for (let i = 0; i < weekDerived.length; i++) {
    if (i === 0) {
      weekDerived[i].week.unlocked = true;
    } else {
      weekDerived[i].week.unlocked = weekDerived[i - 1].week.completed;
    }
  }

  const weeks = weekDerived.map((w) => w.week);
  const completedCount = weeks.filter((w) => w.completed).length;
  const totalWeeks = weeks.length;
  const q1Complete = totalWeeks > 0 && completedCount >= totalWeeks;

  return NextResponse.json({
    student: {
      id: student.id,
      status: student.training_status,
      enrolled_at: student.enrolled_at,
      start_quarter: student.start_quarter,
      entry_quarter: (student as Record<string, unknown>).entry_quarter ?? null,
    },
    program: {
      id: program.id,
      name: program.name,
    },
    weeks,
    total_weeks: totalWeeks,
    completed_count: completedCount,
    q1_complete: q1Complete,
    source: "training" as const,
    program_present: true,
  });
}
