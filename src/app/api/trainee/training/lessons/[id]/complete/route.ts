import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendLessonComplete,
  sendCategoryComplete,
  sendProgramComplete,
} from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/complete
 * Marks a lesson as complete for the authenticated user.
 * After marking, checks if all lessons in the category are now complete →
 * if yes, inserts a category_completions record.
 *
 * Idempotent — duplicate lesson completions are silently ignored.
 *
 * Response: { success: true, categoryCompleted: boolean }
 */
export async function POST(
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

  const { id: lessonId } = await params;
  const admin = createAdminClient();

  // Verify the lesson exists and is active — also fetch title and category
  const { data: lesson, error: lessonError } = await admin
    .from("training_lessons")
    .select("id, title, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Look up lesson_progress to carry started_at / time_spent_seconds into completion record
  const { data: lessonProgress } = await admin
    .from("lesson_progress")
    .select("id, started_at, time_spent_seconds")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  // Mark lesson_progress.completed_at
  if (lessonProgress) {
    await admin
      .from("lesson_progress")
      .update({ completed_at: now })
      .eq("id", lessonProgress.id);
  }

  // Upsert lesson completion with time tracking fields
  // ignoreDuplicates: true — idempotent; we detect "new completion" by checking error/count
  const { error: completionError, count: insertedCount } = await admin
    .from("lesson_completions")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        ...(lessonProgress?.started_at ? { started_at: lessonProgress.started_at } : {}),
        ...(lessonProgress?.time_spent_seconds != null
          ? { time_spent_seconds: lessonProgress.time_spent_seconds }
          : {}),
      },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true, count: "exact" }
    );

  if (completionError) {
    console.error("lesson complete upsert error:", completionError.message);
    return NextResponse.json(
      { error: "Failed to mark lesson complete." },
      { status: 500 }
    );
  }

  // Detect if this is a new (first-time) completion vs. a duplicate upsert
  const isNewCompletion = (insertedCount ?? 0) > 0;

  // Check if all lessons in the category are now complete
  let categoryCompleted = false;
  const categoryId = lesson.category_id;

  if (categoryId) {
    // Count total active lessons in the category
    const { count: totalCount } = await admin
      .from("training_lessons")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .eq("is_active", true);

    if (totalCount && totalCount > 0) {
      // Count how many the user has completed in this category
      const { data: categoryLessons } = await admin
        .from("training_lessons")
        .select("id")
        .eq("category_id", categoryId)
        .eq("is_active", true);

      const categoryLessonIds = (categoryLessons ?? []).map((l) => l.id);

      const { count: completedCount } = await admin
        .from("lesson_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("lesson_id", categoryLessonIds);

      if ((completedCount ?? 0) >= totalCount) {
        // Aggregate started_at (min) and time_spent_seconds (sum) from lesson_progress
        const { data: progressRows } = await admin
          .from("lesson_progress")
          .select("started_at, time_spent_seconds")
          .eq("user_id", user.id)
          .in("lesson_id", categoryLessonIds);

        const catStartedAt =
          progressRows && progressRows.length > 0
            ? progressRows.reduce((min, r) =>
                r.started_at && (!min || r.started_at < min) ? r.started_at : min,
                null as string | null
              )
            : null;

        const catTimeSpent =
          progressRows && progressRows.length > 0
            ? progressRows.reduce((sum, r) => sum + (r.time_spent_seconds ?? 0), 0)
            : null;

        // All lessons done — record category completion (idempotent)
        const { error: catCompError, count: catInsertedCount } = await admin
          .from("category_completions")
          .upsert(
            {
              user_id: user.id,
              category_id: categoryId,
              ...(catStartedAt ? { started_at: catStartedAt } : {}),
              ...(catTimeSpent != null ? { time_spent_seconds: catTimeSpent } : {}),
            },
            { onConflict: "user_id,category_id", ignoreDuplicates: true, count: "exact" }
          );

        if (!catCompError) {
          categoryCompleted = (catInsertedCount ?? 0) > 0;
        }
      }
    }
  }

  // ── Fire-and-forget emails ──────────────────────────────────────────────────
  // Only send emails for new completions (not duplicate/idempotent calls)
  if (isNewCompletion) {
    // Fetch trainee email + name, lesson title, category, and program info in parallel
    const [authUser, categoryRow, progProgressRows] = await Promise.all([
      admin.auth.admin.getUserById(user.id),
      categoryId
        ? admin
            .from("training_categories")
            .select("id, name, training_id")
            .eq("id", categoryId)
            .single()
        : Promise.resolve({ data: null }),
      admin
        .from("user_program_progress")
        .select("program_id, progress_pct, next_category_name, next_lesson_title")
        .eq("user_id", user.id),
    ]);

    const traineeEmail = authUser.data.user?.email ?? "";
    const traineeName =
      authUser.data.user?.user_metadata?.full_name ??
      authUser.data.user?.email?.split("@")[0] ??
      "Trainee";

    const catData = categoryRow.data as {
      id: string;
      name: string;
      training_id: string | null;
    } | null;

    const lessonTitle = lesson.title;
    const categoryName = catData?.name ?? "";

    // Fetch next lesson title for this category from user_category_progress cache
    let nextLessonTitle: string | undefined;
    if (categoryId) {
      const { data: ucpRow } = await admin
        .from("user_category_progress")
        .select("next_lesson_title")
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .maybeSingle();
      nextLessonTitle = ucpRow?.next_lesson_title ?? undefined;
    }

    if (traineeEmail) {
      // Lesson complete email
      sendLessonComplete({
        to: traineeEmail,
        name: traineeName,
        lessonTitle,
        categoryName,
        nextLessonTitle,
      }).catch(() => {});

      // Category complete email (only when newly completed this call)
      if (categoryCompleted && catData?.training_id) {
        const programProgressRows = progProgressRows.data ?? [];
        const programRow = programProgressRows.find(
          (r) => r.program_id === catData.training_id
        );
        const nextCategoryName = programRow?.next_category_name ?? undefined;

        // Fetch program name and completed lesson count
        const [programRow2, lessonsCompletedInCat] = await Promise.all([
          admin
            .from("training_programs")
            .select("name")
            .eq("id", catData.training_id)
            .single(),
          admin
            .from("lesson_completions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .in(
              "lesson_id",
              (
                await admin
                  .from("training_lessons")
                  .select("id")
                  .eq("category_id", categoryId)
                  .eq("is_active", true)
              ).data?.map((l) => l.id) ?? []
            ),
        ]);

        sendCategoryComplete({
          to: traineeEmail,
          name: traineeName,
          categoryName,
          programName: programRow2.data?.name ?? "",
          lessonsCompleted: lessonsCompletedInCat.count ?? 0,
          nextCategoryName,
        }).catch(() => {});

        // Graduation check: if ALL programs for this user have progress_pct >= 100
        const allPrograms = programProgressRows;
        if (
          allPrograms.length > 0 &&
          allPrograms.every((r) => Number(r.progress_pct) >= 100)
        ) {
          // Check that trainee is not already graduated
          const { data: traineeRow } = await admin
            .from("trainees")
            .select("id, graduated_at")
            .eq("user_id", user.id)
            .maybeSingle();

          if (traineeRow && !traineeRow.graduated_at) {
            // Auto-graduate — generate a unique certificate verification code
            const certCode = randomBytes(6).toString("hex").toUpperCase();

            await admin
              .from("trainees")
              .update({
                graduated_at: new Date().toISOString(),
                training_status: "graduated",
                certificate_code: certCode,
              })
              .eq("id", traineeRow.id);

            const programName = programRow2.data?.name ?? "Training Program";
            const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/trainee/certificate`;

            sendProgramComplete({
              to: traineeEmail,
              name: traineeName,
              programName,
              certificateUrl,
            }).catch(() => {});

            // In-app graduation notification (fire-and-forget)
            createNotification({
              userId: user.id,
              title: "🎓 Training Complete!",
              body: "You've completed all programs. Your certificate is ready.",
              type: "training",
              actionUrl: "/trainee/certificate",
            }).catch(() => {});
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, categoryCompleted });
}
