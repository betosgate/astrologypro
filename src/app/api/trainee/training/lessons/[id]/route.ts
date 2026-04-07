import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/trainee/training/lessons/[id]
 * Returns full lesson detail: lesson fields + videos + assets + quiz questions
 * (options included, correct_answer excluded — server-side only)
 * Also returns the user's completion status and whether quiz is passed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch lesson, videos, assets, and quiz questions in parallel
  const [lessonResult, videosResult, assetsResult, questionsResult] =
    await Promise.all([
      admin
        .from("training_lessons")
        .select(
          "id, category_id, title, description, video_url, pdf_url, content, duration_mins, priority, previous_lesson_id, is_active, created_at"
        )
        .eq("id", id)
        .eq("is_active", true)
        .single(),
      admin
        .from("lesson_videos")
        .select("id, title, video_url, duration_mins, priority")
        .eq("lesson_id", id)
        .order("priority", { ascending: true }),
      admin
        .from("lesson_assets")
        .select(
          "id, title, asset_type, url, file_size_bytes, is_downloadable, priority"
        )
        .eq("lesson_id", id)
        .order("priority", { ascending: true }),
      admin
        .from("quiz_questions")
        // Deliberately exclude correct_answer — it stays server-side
        .select("id, question, options, explanation, priority")
        .eq("lesson_id", id)
        .order("priority", { ascending: true }),
    ]);

  if (lessonResult.error || !lessonResult.data) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const lesson = lessonResult.data;

  // ── Fetch training settings and category in parallel ─────────────────────
  const [{ data: category }, { data: trainingSettings }] = await Promise.all([
    admin
      .from("training_categories")
      .select("id, training_id, is_sequential, priority")
      .eq("id", lesson.category_id)
      .single(),
    admin
      .from("training_settings")
      .select("global_sequential_lock")
      .limit(1)
      .maybeSingle(),
  ]);

  // global_sequential_lock = false means no sequential enforcement at all.
  // If not set, default to false (permissive).
  const globalLock = trainingSettings?.global_sequential_lock ?? false;

  if (globalLock) {
    // ── Sequential lock check (category level) ──────────────────────────────
    // Enforced only when global lock is ON and this category has is_sequential ON.
    if (category?.is_sequential) {
      const { data: prevLessons } = await admin
        .from("training_lessons")
        .select("id")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .lt("priority", lesson.priority)
        .order("priority", { ascending: true });

      if (prevLessons && prevLessons.length > 0) {
        const prevIds = prevLessons.map((l) => l.id);
        const { count: completedCount } = await admin
          .from("lesson_completions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("lesson_id", prevIds);

        if ((completedCount ?? 0) < prevIds.length) {
          return NextResponse.json(
            { error: "Complete previous lessons in order first.", locked: true },
            { status: 403 }
          );
        }
      }
    }

    // ── Sequential lock check (program level) ───────────────────────────────
    // Enforced only when global lock is ON and the program has is_sequential ON.
    if (category) {
      const { data: program } = await admin
        .from("training_programs")
        .select("id, is_sequential")
        .eq("id", category.training_id)
        .single();

      if (program?.is_sequential) {
        const { data: prevCats } = await admin
          .from("training_categories")
          .select("id")
          .eq("training_id", program.id)
          .eq("is_active", true)
          .lt("priority", category.priority)
          .order("priority", { ascending: true });

        if (prevCats && prevCats.length > 0) {
          const prevCatIds = prevCats.map((c) => c.id);
          const { count: completedCatCount } = await admin
            .from("category_completions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .in("category_id", prevCatIds);

          if ((completedCatCount ?? 0) < prevCatIds.length) {
            return NextResponse.json(
              {
                error: "Complete previous categories in order first.",
                locked: true,
              },
              { status: 403 }
            );
          }
        }
      }
    }
  }

  // Fetch user's completion + latest quiz attempt status + quiz triggers + progress
  const [completionResult, quizAttemptResult, triggersResult, triggerProgressResult, lessonProgressResult] =
    await Promise.all([
      admin
        .from("lesson_completions")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("lesson_id", id)
        .maybeSingle(),
      admin
        .from("quiz_attempts")
        .select("passed, score, total_questions, attempted_at")
        .eq("user_id", user.id)
        .eq("lesson_id", id)
        .order("attempted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Active quiz triggers for this lesson, with joined question data
      admin
        .from("lesson_quiz_triggers")
        .select(
          "id, trigger_timestamp_seconds, rewind_target_seconds, question_id, priority, quiz_questions(id, question, options, explanation)"
        )
        .eq("lesson_id", id)
        .eq("is_active", true)
        .order("trigger_timestamp_seconds", { ascending: true }),
      // User's trigger progress for this lesson
      admin
        .from("lesson_trigger_progress")
        .select(
          "trigger_id, passed, attempts, last_rewind_at, rewatch_required_until_seconds, rewatch_completed, passed_at"
        )
        .eq("user_id", user.id)
        .eq("lesson_id", id),
      // User's lesson progress (for resume position)
      admin
        .from("lesson_progress")
        .select("last_position_seconds")
        .eq("user_id", user.id)
        .eq("lesson_id", id)
        .maybeSingle(),
    ]);

  // Build a map of trigger_id -> user_progress for quick lookup
  const triggerProgressMap = new Map<string, Record<string, unknown>>();
  for (const tp of triggerProgressResult.data ?? []) {
    triggerProgressMap.set(tp.trigger_id, tp);
  }

  // Shape trigger data: merge question + user_progress
  const triggers = (triggersResult.data ?? []).map((t) => ({
    id: t.id,
    trigger_timestamp_seconds: t.trigger_timestamp_seconds,
    rewind_target_seconds: t.rewind_target_seconds,
    question_id: t.question_id,
    question: t.quiz_questions ?? null,
    user_progress: triggerProgressMap.get(t.id) ?? null,
  }));

  return NextResponse.json({
    lesson: {
      ...lessonResult.data,
      videos: videosResult.data ?? [],
      assets: assetsResult.data ?? [],
      quiz_questions: questionsResult.data ?? [],
      completed: !!completionResult.data,
      completed_at: completionResult.data?.completed_at ?? null,
      quiz_passed: quizAttemptResult.data?.passed ?? null,
      quiz_last_score: quizAttemptResult.data?.score ?? null,
      quiz_last_total: quizAttemptResult.data?.total_questions ?? null,
      quiz_last_attempted_at: quizAttemptResult.data?.attempted_at ?? null,
      triggers,
      last_position_seconds: lessonProgressResult.data?.last_position_seconds ?? 0,
    },
  });
}
