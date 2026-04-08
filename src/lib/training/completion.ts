import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAndAwardTrainingGraduation } from "@/lib/training/graduation";

type LessonProgressRow = {
  id: string;
  started_at: string | null;
  time_spent_seconds: number | null;
};

export async function completeLessonForUser(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
  completedAt: string = new Date().toISOString()
) {
  const { data: lessonProgress } = await admin
    .from("lesson_progress")
    .select("id, started_at, time_spent_seconds")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle<LessonProgressRow>();

  if (lessonProgress) {
    await admin
      .from("lesson_progress")
      .update({ completed_at: completedAt })
      .eq("id", lessonProgress.id);
  }

  const { error, count } = await admin
    .from("lesson_completions")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        ...(lessonProgress?.started_at
          ? { started_at: lessonProgress.started_at }
          : {}),
        ...(lessonProgress?.time_spent_seconds != null
          ? { time_spent_seconds: lessonProgress.time_spent_seconds }
          : {}),
      },
      {
        onConflict: "user_id,lesson_id",
        ignoreDuplicates: true,
        count: "exact",
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  return {
    inserted: (count ?? 0) > 0,
    lessonProgress,
  };
}

export async function syncCategoryCompletionForUser(
  admin: SupabaseClient,
  userId: string,
  categoryId: string
) {
  const { data: categoryLessons, error: lessonsError } = await admin
    .from("training_lessons")
    .select("id")
    .eq("category_id", categoryId)
    .eq("is_active", true);

  if (lessonsError) {
    throw new Error(lessonsError.message);
  }

  const categoryLessonIds = (categoryLessons ?? []).map((lesson) => lesson.id);
  if (categoryLessonIds.length === 0) {
    return { categoryCompleted: false };
  }

  const { count: completedCount, error: completedError } = await admin
    .from("lesson_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", categoryLessonIds);

  if (completedError) {
    throw new Error(completedError.message);
  }

  if ((completedCount ?? 0) < categoryLessonIds.length) {
    return { categoryCompleted: false };
  }

  const { data: progressRows, error: progressError } = await admin
    .from("lesson_progress")
    .select("started_at, time_spent_seconds")
    .eq("user_id", userId)
    .in("lesson_id", categoryLessonIds);

  if (progressError) {
    throw new Error(progressError.message);
  }

  const categoryStartedAt =
    progressRows && progressRows.length > 0
      ? progressRows.reduce((min, row) => {
          if (!row.started_at) return min;
          return !min || row.started_at < min ? row.started_at : min;
        }, null as string | null)
      : null;

  const categoryTimeSpent =
    progressRows && progressRows.length > 0
      ? progressRows.reduce(
          (sum, row) => sum + (row.time_spent_seconds ?? 0),
          0
        )
      : null;

  const { error: categoryError, count: categoryCount } = await admin
    .from("category_completions")
    .upsert(
      {
        user_id: userId,
        category_id: categoryId,
        ...(categoryStartedAt ? { started_at: categoryStartedAt } : {}),
        ...(categoryTimeSpent != null
          ? { time_spent_seconds: categoryTimeSpent }
          : {}),
      },
      {
        onConflict: "user_id,category_id",
        ignoreDuplicates: true,
        count: "exact",
      }
    );

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  return {
    categoryCompleted: (categoryCount ?? 0) > 0,
  };
}

export async function completeLessonAndProgressForUser(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
  completedAt: string = new Date().toISOString()
) {
  const { data: lesson, error: lessonError } = await admin
    .from("training_lessons")
    .select("id, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (lessonError || !lesson) {
    throw new Error("Lesson not found.");
  }

  const lessonResult = await completeLessonForUser(
    admin,
    userId,
    lessonId,
    completedAt
  );

  const categoryResult = lesson.category_id
    ? await syncCategoryCompletionForUser(admin, userId, lesson.category_id)
    : { categoryCompleted: false };

  await checkAndAwardTrainingGraduation(userId);

  return {
    inserted: lessonResult.inserted,
    categoryCompleted: categoryResult.categoryCompleted,
  };
}
