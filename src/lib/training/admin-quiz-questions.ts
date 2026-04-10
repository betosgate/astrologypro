import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminQuizQuestion = {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  priority: number;
  remediation_video_id: string | null;
  remediation_video_index: number | null;
  remediation_start_seconds: number | null;
  remediation_replay_until_seconds: number | null;
  remediation_message: string | null;
};

type QuizQuestionRow = {
  id?: string;
  lesson_id?: string;
  question: string;
  options: unknown;
  correct_answer: number;
  explanation?: string | null;
  priority?: number | null;
  remediation_video_id?: string | null;
  remediation_video_index?: number | null;
  remediation_start_seconds?: number | null;
  remediation_replay_until_seconds?: number | null;
  remediation_message?: string | null;
};

function isMissingRemediationColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  // PostgreSQL error code 42703 = undefined_column (most reliable check)
  const code = (error as { code?: unknown }).code;
  if (code === "42703") return true;

  // PostgREST sometimes wraps the code differently — check PGRST204 (column not found)
  if (code === "PGRST204") return true;

  // Fallback: string match on error message for older PostgREST versions
  if (
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.includes("remediation_")
  ) {
    return true;
  }

  return false;
}

function normalizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [] as string[];
  return options.flatMap((option) => {
    if (typeof option === "string") {
      const text = option.trim();
      return text ? [text] : [];
    }
    if (
      option &&
      typeof option === "object" &&
      "text" in option &&
      typeof (option as { text?: unknown }).text === "string"
    ) {
      const text = ((option as { text: string }).text).trim();
      return text ? [text] : [];
    }
    return [];
  });
}

function parseNullableInt(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function parseCorrectAnswer(raw: unknown, options: string[]) {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < options.length) {
    return raw;
  }
  if (typeof raw === "string") {
    const idx = options.findIndex((option) => option === raw.trim());
    return idx >= 0 ? idx : null;
  }
  return null;
}

export function normalizeAdminQuizQuestions(raw: unknown): {
  questions: AdminQuizQuestion[];
  error?: string;
} {
  if (!Array.isArray(raw)) {
    return { questions: [], error: "Questions must be an array." };
  }

  const questions: AdminQuizQuestion[] = [];

  for (let idx = 0; idx < raw.length; idx += 1) {
    const item = raw[idx];
    if (!item || typeof item !== "object") {
      return { questions: [], error: `Question ${idx + 1} is invalid.` };
    }

    const questionText =
      typeof (item as { question?: unknown }).question === "string"
        ? (item as { question: string }).question.trim()
        : "";
    if (!questionText) {
      return { questions: [], error: `Question ${idx + 1} must include text.` };
    }

    const options = normalizeOptions((item as { options?: unknown }).options);
    if (options.length < 2) {
      return {
        questions: [],
        error: `Question ${idx + 1} must include at least 2 non-empty options.`,
      };
    }

    const correctAnswer = parseCorrectAnswer(
      (item as { correct_answer?: unknown; answer?: unknown }).correct_answer ??
        (item as { answer?: unknown }).answer,
      options,
    );
    if (correctAnswer === null) {
      return {
        questions: [],
        error: `Question ${idx + 1} must include a valid correct answer.`,
      };
    }

    const remStart = parseNullableInt(
      (item as { remediation_start_seconds?: unknown }).remediation_start_seconds,
    );
    const remReplay = parseNullableInt(
      (item as { remediation_replay_until_seconds?: unknown }).remediation_replay_until_seconds,
    );
    if (remStart !== null && remReplay !== null && remReplay <= remStart) {
      return {
        questions: [],
        error:
          `Question ${idx + 1}: remediation replay-until must be greater than start.`,
      };
    }

    questions.push({
      question: questionText,
      options,
      correct_answer: correctAnswer,
      explanation:
        typeof (item as { explanation?: unknown }).explanation === "string"
          ? (item as { explanation: string }).explanation.trim() || null
          : null,
      priority:
        typeof (item as { priority?: unknown }).priority === "number" &&
        Number.isFinite((item as { priority: number }).priority)
          ? Math.round((item as { priority: number }).priority)
          : idx,
      remediation_video_id:
        typeof (item as { remediation_video_id?: unknown }).remediation_video_id === "string"
          ? (item as { remediation_video_id: string }).remediation_video_id.trim() || null
          : null,
      remediation_video_index: parseNullableInt(
        (item as { remediation_video_index?: unknown }).remediation_video_index,
      ),
      remediation_start_seconds: remStart,
      remediation_replay_until_seconds: remReplay,
      remediation_message:
        typeof (item as { remediation_message?: unknown }).remediation_message === "string"
          ? (item as { remediation_message: string }).remediation_message.trim() || null
          : null,
    });
  }

  return { questions };
}

export async function listQuizQuestionsCompat(
  admin: SupabaseClient,
  lessonId: string,
) {
  const withRemediation = await admin
    .from("quiz_questions")
    .select(
      "id, lesson_id, question, options, correct_answer, explanation, priority, remediation_video_id, remediation_video_index, remediation_start_seconds, remediation_replay_until_seconds, remediation_message",
    )
    .eq("lesson_id", lessonId)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (!withRemediation.error) {
    return {
      questions: (withRemediation.data ?? []).map((row) => ({
        ...row,
        options: normalizeOptions(row.options),
      })),
      remediationSupported: true,
    };
  }

  if (!isMissingRemediationColumnError(withRemediation.error)) {
    throw withRemediation.error;
  }

  const fallback = await admin
    .from("quiz_questions")
    .select("id, lesson_id, question, options, correct_answer, explanation, priority")
    .eq("lesson_id", lessonId)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (fallback.error) {
    throw fallback.error;
  }

  return {
    questions: (fallback.data ?? []).map((row) => ({
      ...row,
      options: normalizeOptions(row.options),
      remediation_video_id: null,
      remediation_video_index: null,
      remediation_start_seconds: null,
      remediation_replay_until_seconds: null,
      remediation_message: null,
    })),
    remediationSupported: false,
  };
}

export async function findQuizQuestionCompat(
  admin: SupabaseClient,
  lessonId: string,
  questionId: string,
) {
  const listed = await listQuizQuestionsCompat(admin, lessonId);
  return {
    question: listed.questions.find((question) => question.id === questionId) ?? null,
    remediationSupported: listed.remediationSupported,
  };
}

export async function insertQuizQuestionCompat(
  admin: SupabaseClient,
  lessonId: string,
  question: AdminQuizQuestion,
) {
  const payload: QuizQuestionRow = {
    lesson_id: lessonId,
    question: question.question,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    priority: question.priority,
    remediation_video_id: question.remediation_video_id,
    remediation_video_index: question.remediation_video_index,
    remediation_start_seconds: question.remediation_start_seconds,
    remediation_replay_until_seconds: question.remediation_replay_until_seconds,
    remediation_message: question.remediation_message,
  };

  const withRemediation = await admin
    .from("quiz_questions")
    .insert(payload)
    .select()
    .single();

  if (!withRemediation.error) {
    return { question: withRemediation.data, remediationSupported: true };
  }

  if (!isMissingRemediationColumnError(withRemediation.error)) {
    throw withRemediation.error;
  }

  const fallback = await admin
    .from("quiz_questions")
    .insert({
      lesson_id: lessonId,
      question: question.question,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      priority: question.priority,
    })
    .select()
    .single();

  if (fallback.error) {
    throw fallback.error;
  }

  return { question: fallback.data, remediationSupported: false };
}

export async function replaceQuizQuestionsForLessonCompat(
  admin: SupabaseClient,
  lessonId: string,
  questions: AdminQuizQuestion[],
) {
  const existing = await listQuizQuestionsCompat(admin, lessonId);

  const { error: deleteError } = await admin
    .from("quiz_questions")
    .delete()
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw deleteError;
  }

  if (questions.length === 0) {
    return { remediationSupported: existing.remediationSupported };
  }

  const baseRows = questions.map((question, idx) => ({
    lesson_id: lessonId,
    question: question.question,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    priority: question.priority ?? idx,
  }));

  if (!existing.remediationSupported) {
    const fallbackInsert = await admin.from("quiz_questions").insert(baseRows);
    if (fallbackInsert.error) throw fallbackInsert.error;
    return { remediationSupported: false };
  }

  const withRemediationRows = questions.map((question, idx) => ({
    ...baseRows[idx],
    remediation_video_id: question.remediation_video_id,
    remediation_video_index: question.remediation_video_index,
    remediation_start_seconds: question.remediation_start_seconds,
    remediation_replay_until_seconds: question.remediation_replay_until_seconds,
    remediation_message: question.remediation_message,
  }));

  const insertResult = await admin.from("quiz_questions").insert(withRemediationRows);
  if (!insertResult.error) {
    return { remediationSupported: true };
  }

  if (!isMissingRemediationColumnError(insertResult.error)) {
    throw insertResult.error;
  }

  const fallbackInsert = await admin.from("quiz_questions").insert(baseRows);
  if (fallbackInsert.error) throw fallbackInsert.error;
  return { remediationSupported: false };
}

export async function selectLessonQuestionsForLearnerCompat(
  admin: SupabaseClient,
  lessonId: string,
) {
  const listed = await listQuizQuestionsCompat(admin, lessonId);
  return listed.questions.map((row) => ({
    id: row.id,
    question: row.question,
    options: row.options,
    correct_answer: row.correct_answer,
    explanation: row.explanation ?? null,
    priority: row.priority ?? 0,
    remediation_video_id: row.remediation_video_id ?? null,
    remediation_video_index: row.remediation_video_index ?? null,
    remediation_start_seconds: row.remediation_start_seconds ?? null,
    remediation_replay_until_seconds: row.remediation_replay_until_seconds ?? null,
    remediation_message: row.remediation_message ?? null,
  }));
}
