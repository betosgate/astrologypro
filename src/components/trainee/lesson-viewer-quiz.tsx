"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types — options from the API have no correct_answer exposed to client
// ---------------------------------------------------------------------------
export type QuizQuestionClient = {
  id: string;
  question: string;
  options: { text: string }[];
  explanation?: string | null;
};

export type QuizResultItem = {
  question: string;
  correct: boolean;
  selected: number;
  correct_index: number;
  explanation: string | null;
};

interface LessonViewerQuizProps {
  lessonId: string;
  questions: QuizQuestionClient[];
  alreadyPassed: boolean;
  lastScore?: number | null;
  lastTotal?: number | null;
  onPassed?: () => void; // called after successful pass to trigger completion UI
}

export function LessonViewerQuiz({
  lessonId,
  questions,
  alreadyPassed,
  lastScore,
  lastTotal,
  onPassed,
}: LessonViewerQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResultItem[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);

  if (alreadyPassed) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-4 space-y-1">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-green-500 shrink-0" />
          <span className="text-sm font-semibold text-green-600">Quiz Passed</span>
        </div>
        {lastScore != null && lastTotal != null && (
          <p className="text-xs text-green-600/80 pl-7">
            Score: {lastScore}/{lastTotal} ({Math.round((lastScore / lastTotal) * 100)}%)
          </p>
        )}
      </div>
    );
  }

  const totalQ = questions.length;
  const progressPct = totalQ > 0 ? Math.round(((currentQ + 1) / totalQ) * 100) : 0;
  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  function selectOption(optIdx: number) {
    if (results) return; // quiz submitted
    setAnswers((prev) => ({ ...prev, [currentQ]: optIdx }));
  }

  async function handleSubmit() {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const answersArr = questions.map((_, i) => answers[i] as number);
      const res = await fetch(
        `/api/trainee/training/lessons/${lessonId}/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersArr }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Failed to submit quiz");
      }

      const json: {
        score: number;
        total: number;
        passed: boolean;
        results: QuizResultItem[];
      } = await res.json();

      setScore(json.score);
      setTotal(json.total);
      setPassed(json.passed);
      setResults(json.results);

      if (json.passed) {
        toast.success("Quiz passed! Lesson marked as complete.");
        onPassed?.();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit quiz.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResults(null);
    setScore(null);
    setTotal(null);
    setPassed(false);
    setCurrentQ(0);
  }

  const q = questions[currentQ];

  // ---- Results view ----
  if (results) {
    return (
      <div className="space-y-4">
        {/* Score summary */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            passed
              ? "border-green-500/40 bg-green-500/5"
              : "border-red-400/40 bg-red-500/5"
          )}
        >
          {passed ? (
            <CheckCircle2 className="size-5 text-green-500 shrink-0" />
          ) : (
            <XCircle className="size-5 text-red-500 shrink-0" />
          )}
          <div className="flex-1">
            <p
              className={cn(
                "font-semibold text-sm",
                passed ? "text-green-600" : "text-red-600"
              )}
            >
              {passed ? "You passed!" : "Not quite — try again"}
            </p>
            <p
              className={cn(
                "text-xs mt-0.5",
                passed ? "text-green-600/80" : "text-red-600/80"
              )}
            >
              {score}/{total} correct (
              {total && total > 0
                ? Math.round(((score ?? 0) / total) * 100)
                : 0}
              %)
            </p>
          </div>
        </div>

        {/* Per-question results */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-3 text-sm space-y-2",
                r.correct
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-400/30 bg-red-500/5"
              )}
            >
              <div className="flex items-start gap-2">
                {r.correct ? (
                  <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <p className="font-medium text-xs">
                  Q{i + 1}: {r.question}
                </p>
              </div>
              {!r.correct && (
                <div className="pl-6 space-y-0.5 text-xs">
                  <p className="text-red-600">
                    Your answer:{" "}
                    {questions[i]?.options[r.selected]?.text ?? "—"}
                  </p>
                  <p className="text-green-600">
                    Correct:{" "}
                    {questions[i]?.options[r.correct_index]?.text ?? "—"}
                  </p>
                </div>
              )}
              {r.explanation && (
                <p className="pl-6 text-xs text-muted-foreground italic">
                  {r.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        {!passed && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="w-full"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // ---- Question view ----
  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {currentQ + 1} of {totalQ}
          </span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-1" />
      </div>

      {/* Question */}
      <p className="text-sm font-medium leading-snug">{q.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {(q.options as { text: string }[]).map((opt, oIdx) => {
          const isSelected = answers[currentQ] === oIdx;
          return (
            <button
              key={oIdx}
              onClick={() => selectOption(oIdx)}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
          disabled={currentQ === 0}
          aria-label="Previous question"
        >
          <ChevronLeft className="size-4 mr-1" />
          Prev
        </Button>

        {currentQ < totalQ - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentQ((q) => Math.min(totalQ - 1, q + 1))}
            aria-label="Next question"
          >
            Next
            <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </Button>
        )}
      </div>

      {/* Answered count */}
      {!allAnswered && (
        <p className="text-xs text-center text-muted-foreground">
          {Object.keys(answers).length}/{totalQ} answered
        </p>
      )}
    </div>
  );
}
