"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Loader2,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type QuizOption = string | { text?: string | null } | null | undefined;

export interface QuestionRemediation {
  video_id: string | null;
  video_index: number | null;
  start_seconds: number | null;
  replay_until_seconds: number | null;
  message: string | null;
}

export type QuizQuestionClient = {
  id: string;
  question: string;
  options: QuizOption[];
  explanation?: string | null;
  // Module 04 — exposed by /api/trainee/training/lessons/[id]
  remediation_video_id?: string | null;
  remediation_video_index?: number | null;
  remediation_start_seconds?: number | null;
  remediation_replay_until_seconds?: number | null;
  remediation_message?: string | null;
};

export type QuizQuestionProgressClient = {
  question_id: string;
  selected_answer: number;
  answered_correctly: boolean;
};

interface LessonViewerQuizProps {
  lessonId: string;
  questions: QuizQuestionClient[];
  alreadyPassed: boolean;
  initialProgress?: QuizQuestionProgressClient[];
  /**
   * Called when the learner answers a question wrong AND that question has
   * remediation metadata. Parent should pause the video, seek to
   * `remediation.start_seconds`, play, and call `onRemediationReady` once
   * playback has reached `remediation.replay_until_seconds`.
   *
   * If this prop is not supplied, the quiz falls back to inline retry
   * (the wrong answer is highlighted, the learner picks again).
   */
  onWrongAnswer?: (
    remediation: QuestionRemediation,
    questionIndex: number,
  ) => void;
  /**
   * Imperative signal from the parent telling the quiz "remediation is done,
   * the learner can retry now". Parent toggles this to true once playback
   * has reached the required replay-until timestamp. Quiz reads it and
   * re-enables the retry interaction. Toggle back to false after the next
   * Submit click.
   */
  remediationReady?: boolean;
  /** Called after the lesson quiz is fully passed (all answers correct). */
  onPassed?: () => void;
}

function getOptionLabel(option: QuizOption, fallback: string) {
  if (typeof option === "string") {
    const trimmed = option.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (option && typeof option === "object" && typeof option.text === "string") {
    const trimmed = option.text.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  return fallback;
}

function questionRemediation(q: QuizQuestionClient): QuestionRemediation | null {
  const hasAny =
    q.remediation_start_seconds != null ||
    q.remediation_replay_until_seconds != null ||
    q.remediation_message != null;
  if (!hasAny) return null;
  return {
    video_id: q.remediation_video_id ?? null,
    video_index: q.remediation_video_index ?? null,
    start_seconds: q.remediation_start_seconds ?? null,
    replay_until_seconds: q.remediation_replay_until_seconds ?? null,
    message: q.remediation_message ?? null,
  };
}

function buildInitialConfirmedAnswers(
  questions: QuizQuestionClient[],
  initialProgress: QuizQuestionProgressClient[] | undefined,
) {
  const progressByQuestion = new Map(
    (initialProgress ?? [])
      .filter((progress) => progress.answered_correctly)
      .map((progress) => [progress.question_id, progress.selected_answer]),
  );

  return questions.reduce<Record<number, number>>((acc, question, idx) => {
    const selectedAnswer = progressByQuestion.get(question.id);
    if (selectedAnswer != null && Number.isInteger(selectedAnswer)) {
      acc[idx] = selectedAnswer;
    }
    return acc;
  }, {});
}

function firstUnansweredIndex(
  questions: QuizQuestionClient[],
  confirmedAnswers: Record<number, number>,
) {
  const idx = questions.findIndex((_, questionIdx) => confirmedAnswers[questionIdx] == null);
  return idx >= 0 ? idx : Math.max(0, questions.length - 1);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function LessonViewerQuiz({
  lessonId,
  questions,
  alreadyPassed,
  initialProgress,
  onWrongAnswer,
  remediationReady,
  onPassed,
}: LessonViewerQuizProps) {
  const initialConfirmedAnswers = buildInitialConfirmedAnswers(
    questions,
    initialProgress,
  );
  const [currentIdx, setCurrentIdx] = useState(() =>
    firstUnansweredIndex(questions, initialConfirmedAnswers),
  );
  // Per-question stored answers — used at the end to call the legacy batch
  // /quiz endpoint which records the attempt + completes the lesson.
  const [confirmedAnswers, setConfirmedAnswers] =
    useState<Record<number, number>>(initialConfirmedAnswers);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [waitingForReplay, setWaitingForReplay] = useState(false);
  const [showWrongMessage, setShowWrongMessage] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);

  const wrongMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parent signal: remediation playback finished, retry is allowed.
  useEffect(() => {
    if (waitingForReplay && remediationReady) {
      setWaitingForReplay(false);
      // Hide the toast-style banner once focus returns to the quiz.
      setShowWrongMessage(null);
    }
  }, [waitingForReplay, remediationReady]);

  useEffect(() => {
    return () => {
      if (wrongMessageTimerRef.current) clearTimeout(wrongMessageTimerRef.current);
    };
  }, []);

  if (alreadyPassed) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 space-y-1">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">Quiz already passed.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          You have already completed the quiz for this lesson.
        </p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        No quiz questions are available for this lesson yet.
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">
            Quiz complete — every question answered correctly.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          The lesson has been marked complete. You can move on to the next lesson.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const totalCount = questions.length;
  const answeredCount = Object.keys(confirmedAnswers).length;
  const progressPct = Math.round((answeredCount / totalCount) * 100);
  const currentAlreadyAnswered = confirmedAnswers[currentIdx] != null;
  const allQuestionsAnswered = answeredCount >= totalCount;

  async function handleSubmit() {
    if (selectedOption == null || waitingForReplay || submitting) return;

    setSubmitting(true);
    setIsWrong(false);
    try {
      // 1. Per-question grading via the new /quiz/answer endpoint.
      const res = await fetch(
        `/api/trainee/training/lessons/${lessonId}/quiz/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            answer_index: selectedOption,
          }),
        },
      );
      const body = await res.json();

      if (!res.ok) {
        toast.error("Could not submit answer", {
          description: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }

      if (body.correct === true) {
        // Record the chosen answer; advance.
        const next = { ...confirmedAnswers, [currentIdx]: selectedOption };
        setConfirmedAnswers(next);
        setSelectedOption(null);
        setIsWrong(false);

        if (currentIdx + 1 >= totalCount) {
          // All questions answered correctly — finalize via the existing
          // batch endpoint to record the attempt + complete the lesson.
          await finalize(next);
        } else {
          setCurrentIdx((i) => i + 1);
        }
        return;
      }

      // Wrong answer.
      setIsWrong(true);
      const remediation =
        (body.remediation as QuestionRemediation | null | undefined) ??
        questionRemediation(currentQuestion);

      if (remediation && onWrongAnswer) {
        // Hand control to the parent — it will pause/seek/play the video
        // and signal back via remediationReady when playback has finished
        // the required replay window.
        const message =
          remediation.message ??
          "Let's review the relevant part of the video, then try again.";
        setShowWrongMessage(message);
        setWaitingForReplay(true);

        // Auto-hide the inline message after ~6s — the parent's video
        // playback continues independently.
        if (wrongMessageTimerRef.current) clearTimeout(wrongMessageTimerRef.current);
        wrongMessageTimerRef.current = setTimeout(() => {
          setShowWrongMessage(null);
        }, 6000);

        onWrongAnswer(remediation, currentIdx);
      } else {
        // Inline retry fallback when there is no remediation metadata.
        const message =
          (body.explanation as string | null) ??
          currentQuestion.explanation ??
          "That's not quite right. Try again.";
        toast.warning("Incorrect", { description: message });
      }
    } catch (err) {
      toast.error("Network error", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function finalize(answersByIndex: Record<number, number>) {
    // Build the answers array in question order so the legacy batch route
    // can grade and record the attempt.
    const answersArray = questions.map((_, idx) => answersByIndex[idx] ?? -1);
    try {
      const res = await fetch(
        `/api/trainee/training/lessons/${lessonId}/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersArray }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        toast.error("Could not record quiz attempt", {
          description: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setAllDone(true);
      toast.success("Quiz complete", {
        description: "All questions answered correctly. Lesson marked complete.",
      });
      onPassed?.();
    } catch (err) {
      toast.error("Network error finalizing quiz", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress + question counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            Question {currentIdx + 1} of {totalCount}
          </span>
          <span className="tabular-nums">{answeredCount} answered</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      {/* Question text */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium leading-relaxed">{currentQuestion.question}</p>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((opt, oIdx) => {
            const label = getOptionLabel(opt, `Option ${oIdx + 1}`);
            const confirmedOption = confirmedAnswers[currentIdx];
            const isSelected =
              selectedOption === oIdx || confirmedOption === oIdx;
            const disabled =
              waitingForReplay || submitting || currentAlreadyAnswered;
            return (
              <button
                key={oIdx}
                type="button"
                onClick={() => !disabled && setSelectedOption(oIdx)}
                disabled={disabled}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                  isSelected
                    ? isWrong
                      ? "border-destructive bg-destructive/5"
                      : "border-primary bg-primary/5"
                    : "hover:border-primary/30 hover:bg-muted/40",
                  disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                )}
              >
                <span className="text-muted-foreground tabular-nums mr-2">
                  {String.fromCharCode(65 + oIdx)}.
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {currentAlreadyAnswered && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <p className="leading-snug">
              This question was already answered correctly. Continue to the
              next unanswered question.
            </p>
          </div>
        )}

        {/* Wrong-answer remediation banner */}
        {isWrong && showWrongMessage && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            <XCircle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{showWrongMessage}</p>
          </div>
        )}

        {waitingForReplay && (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
            <Video className="size-4 shrink-0 animate-pulse" />
            <p className="leading-snug">
              Replaying the relevant video segment. The retry button will
              re-enable when the segment finishes.
            </p>
          </div>
        )}

        {/* Submit / retry */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            {currentIdx > 0 && (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={waitingForReplay || submitting}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="size-3" />
                Previous
              </button>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (currentAlreadyAnswered) {
                if (allQuestionsAnswered) {
                  finalize(confirmedAnswers);
                } else {
                  setCurrentIdx((idx) =>
                    Math.min(totalCount - 1, idx + 1),
                  );
                }
                return;
              }
              handleSubmit();
            }}
            disabled={
              (!currentAlreadyAnswered && selectedOption == null) ||
              waitingForReplay ||
              submitting
            }
          >
            {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {currentAlreadyAnswered
              ? allQuestionsAnswered
                ? "Finish quiz"
                : "Continue"
              : isWrong && !waitingForReplay
              ? "Try again"
              : currentIdx + 1 === totalCount
                ? "Submit final answer"
                : "Submit and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
