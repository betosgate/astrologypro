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

  // Fetch user's completion + latest quiz attempt status
  const [completionResult, quizAttemptResult] = await Promise.all([
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
  ]);

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
    },
  });
}
