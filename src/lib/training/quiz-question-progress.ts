import type { SupabaseClient } from "@supabase/supabase-js";

export type QuizQuestionProgress = {
  question_id: string;
  selected_answer: number;
  answered_correctly: boolean;
  answered_at: string | null;
};

function isMissingProgressTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  if (code === "42P01" || code === "PGRST205") return true;
  if (
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.includes("quiz_question_progress")
  ) {
    return true;
  }
  return false;
}

export async function listCorrectQuizQuestionProgress(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<{ progress: QuizQuestionProgress[]; supported: boolean }> {
  const { data, error } = await admin
    .from("quiz_question_progress")
    .select("question_id, selected_answer, answered_correctly, answered_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .eq("answered_correctly", true)
    .order("answered_at", { ascending: true });

  if (!error) {
    return {
      progress: (data ?? []).map((row) => ({
        question_id: String(row.question_id),
        selected_answer: Number(row.selected_answer),
        answered_correctly: row.answered_correctly === true,
        answered_at:
          typeof row.answered_at === "string" ? row.answered_at : null,
      })),
      supported: true,
    };
  }

  if (isMissingProgressTableError(error)) {
    return { progress: [], supported: false };
  }

  throw error;
}

export async function upsertCorrectQuizQuestionProgress(
  admin: SupabaseClient,
  {
    userId,
    lessonId,
    questionId,
    selectedAnswer,
  }: {
    userId: string;
    lessonId: string;
    questionId: string;
    selectedAnswer: number;
  },
): Promise<{ supported: boolean }> {
  const now = new Date().toISOString();
  const { error } = await admin.from("quiz_question_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      answered_correctly: true,
      answered_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id,question_id" },
  );

  if (!error) return { supported: true };
  if (isMissingProgressTableError(error)) return { supported: false };
  throw error;
}

export async function clearQuizQuestionProgress(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<{ supported: boolean }> {
  const { error } = await admin
    .from("quiz_question_progress")
    .delete()
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);

  if (!error) return { supported: true };
  if (isMissingProgressTableError(error)) return { supported: false };
  throw error;
}
