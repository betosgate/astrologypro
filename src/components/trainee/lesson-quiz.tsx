"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizOption {
  text: string;
  correct: boolean;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

interface LessonQuizProps {
  questions: QuizQuestion[];
  passScore: number; // percentage (0–100)
  lessonId: string;
  alreadyPassed: boolean;
}

export default function LessonQuiz({ questions, passScore, lessonId, alreadyPassed }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionIndex → optionIndex
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (alreadyPassed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <CheckCircle2 className="size-5 text-primary shrink-0" />
        <span className="text-sm font-medium text-primary">Quiz passed</span>
      </div>
    );
  }

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  function handleSelect(qIdx: number, oIdx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  }

  async function handleSubmit() {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    let correct = 0;
    questions.forEach((q, i) => {
      if (q.options[answers[i]]?.correct) correct++;
    });

    const pct = Math.round((correct / questions.length) * 100);
    const didPass = pct >= passScore;

    setScore(pct);
    setPassed(didPass);
    setSubmitted(true);

    if (didPass) {
      setSaving(true);
      try {
        const res = await fetch("/api/trainee/lesson-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, quizScore: pct, quizPassed: true }),
        });
        if (!res.ok) throw new Error("Failed to save progress");
        toast.success("Quiz passed! Lesson marked as complete.");
      } catch {
        toast.error("Could not save your progress. Please try again.");
      } finally {
        setSaving(false);
      }
    }
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setPassed(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Lesson Quiz</CardTitle>
          <span className="text-sm text-muted-foreground">
            Pass mark: {passScore}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="space-y-3">
            <p className="text-sm font-medium">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[qIdx] === oIdx;
                const showCorrect = submitted && opt.correct;
                const showWrong = submitted && isSelected && !opt.correct;

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    disabled={submitted}
                    className={[
                      "w-full rounded-md border px-4 py-2.5 text-left text-sm transition-colors",
                      submitted
                        ? showCorrect
                          ? "border-green-500 bg-green-50 text-green-800"
                          : showWrong
                          ? "border-red-400 bg-red-50 text-red-800"
                          : "border-border bg-muted/30 text-muted-foreground"
                        : isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                    ].join(" ")}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full">
            Submit Quiz
          </Button>
        ) : (
          <div className="space-y-4">
            <div className={[
              "flex items-center gap-3 rounded-lg border px-4 py-3",
              passed
                ? "border-green-500 bg-green-50"
                : "border-red-400 bg-red-50",
            ].join(" ")}>
              {passed ? (
                <CheckCircle2 className="size-5 text-green-600 shrink-0" />
              ) : (
                <XCircle className="size-5 text-red-500 shrink-0" />
              )}
              <div>
                <p className={["font-medium text-sm", passed ? "text-green-800" : "text-red-700"].join(" ")}>
                  {passed ? "You passed!" : "Not quite — try again"}
                </p>
                <p className={["text-xs mt-0.5", passed ? "text-green-700" : "text-red-600"].join(" ")}>
                  Score: {score}% {passed ? `(pass mark: ${passScore}%)` : `— need ${passScore}% to pass`}
                </p>
              </div>
              {passed && saving && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Saving…
                </Badge>
              )}
            </div>
            {!passed && (
              <Button variant="outline" onClick={handleRetry} className="w-full">
                Retry Quiz
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
