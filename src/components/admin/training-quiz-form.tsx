"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export interface TrainingQuizLessonOption {
  id: string;
  title: string;
}

export interface TrainingQuizQuestionFormValue {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  priority: number;
  remediation_video_index: number | null;
  remediation_start_seconds: number | null;
  remediation_replay_until_seconds: number | null;
}

export interface TrainingQuizFormValue {
  title: string;
  lesson_id: string;
  pass_score: number;
  is_active: boolean;
  questions: TrainingQuizQuestionFormValue[];
}

interface TrainingQuizFormProps {
  heading: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  lessons: TrainingQuizLessonOption[];
  initialValue: TrainingQuizFormValue;
  loading?: boolean;
  remediationSupported?: boolean;
  onSubmit: (value: TrainingQuizFormValue) => Promise<void>;
}

type QuestionDraft = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct_answer: string;
  explanation: string;
  priority: string;
  remediation_video_index: string;
  remediation_start_seconds: string;
  remediation_replay_until_seconds: string;
};

const EMPTY_DRAFT: QuestionDraft = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correct_answer: "0",
  explanation: "",
  priority: "0",
  remediation_video_index: "",
  remediation_start_seconds: "",
  remediation_replay_until_seconds: "",
};

function toDraft(question: TrainingQuizQuestionFormValue): QuestionDraft {
  return {
    question: question.question,
    optionA: question.options[0] ?? "",
    optionB: question.options[1] ?? "",
    optionC: question.options[2] ?? "",
    optionD: question.options[3] ?? "",
    correct_answer: String(question.correct_answer ?? 0),
    explanation: question.explanation ?? "",
    priority: String(question.priority ?? 0),
    remediation_video_index:
      question.remediation_video_index != null ? String(question.remediation_video_index) : "",
    remediation_start_seconds:
      question.remediation_start_seconds != null ? String(question.remediation_start_seconds) : "",
    remediation_replay_until_seconds:
      question.remediation_replay_until_seconds != null
        ? String(question.remediation_replay_until_seconds)
        : "",
  };
}

function parseIntOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function buildQuestion(draft: QuestionDraft): TrainingQuizQuestionFormValue | null {
  if (!draft.question.trim()) {
    toast.error("Question text is required.");
    return null;
  }

  const options = [
    draft.optionA.trim(),
    draft.optionB.trim(),
    draft.optionC.trim(),
    draft.optionD.trim(),
  ].filter(Boolean);

  if (options.length < 2) {
    toast.error("Each question needs at least 2 options.");
    return null;
  }

  const correctAnswer = Number.parseInt(draft.correct_answer, 10);
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
    toast.error("Pick a valid correct answer.");
    return null;
  }

  const remStart = parseIntOrNull(draft.remediation_start_seconds);
  const remUntil = parseIntOrNull(draft.remediation_replay_until_seconds);
  if (remStart !== null && remUntil !== null && remUntil <= remStart) {
    toast.error("Replay-until must be greater than remediation start.");
    return null;
  }

  return {
    question: draft.question.trim(),
    options,
    correct_answer: correctAnswer,
    explanation: draft.explanation.trim() || null,
    priority: parseIntOrNull(draft.priority) ?? 0,
    remediation_video_index: parseIntOrNull(draft.remediation_video_index),
    remediation_start_seconds: remStart,
    remediation_replay_until_seconds: remUntil,
  };
}

export function TrainingQuizForm({
  heading,
  description,
  submitLabel,
  cancelHref,
  lessons,
  initialValue,
  loading = false,
  remediationSupported = true,
  onSubmit,
}: TrainingQuizFormProps) {
  const [form, setForm] = useState<TrainingQuizFormValue>(initialValue);
  const [draft, setDraft] = useState<QuestionDraft>(EMPTY_DRAFT);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const lessonOptions = useMemo(() => lessons, [lessons]);

  function updateDraft(key: keyof QuestionDraft, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetDraft() {
    setDraft(EMPTY_DRAFT);
    setEditingIndex(null);
  }

  function handleAddOrUpdateQuestion() {
    const nextQuestion = buildQuestion(draft);
    if (!nextQuestion) return;

    setForm((prev) => {
      const questions = [...prev.questions];
      if (editingIndex === null) {
        questions.push(nextQuestion);
      } else {
        questions[editingIndex] = nextQuestion;
      }
      return { ...prev, questions };
    });

    resetDraft();
  }

  function handleEditQuestion(index: number) {
    setEditingIndex(index);
    setDraft(toDraft(form.questions[index]));

    // Scroll the "Edit Question" card into view after state update.
    requestAnimationFrame(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleDeleteQuestion(index: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, currentIndex) => currentIndex !== index),
    }));
    if (editingIndex === index) {
      resetDraft();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.lesson_id) {
      toast.error("Lesson is required.");
      return;
    }
    if (form.questions.length === 0) {
      toast.error("Add at least one question.");
      return;
    }
    if (!Number.isInteger(form.pass_score) || form.pass_score < 0 || form.pass_score > 100) {
      toast.error("Pass score must be between 0 and 100.");
      return;
    }
    await onSubmit({
      ...form,
      title: form.title.trim(),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={cancelHref}>← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">{heading}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quiz-title">Title</Label>
                <Input
                  id="quiz-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Birth Chart Basics Quiz"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quiz-lesson">Lesson</Label>
                <select
                  id="quiz-lesson"
                  value={form.lesson_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lesson_id: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select lesson</option>
                  {lessonOptions.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quiz-pass-score">Pass Score (%)</Label>
                <Input
                  id="quiz-pass-score"
                  type="number"
                  min="0"
                  max="100"
                  value={String(form.pass_score)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pass_score: Number.parseInt(e.target.value || "0", 10),
                    }))
                  }
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="size-4 rounded border-input accent-primary"
                  />
                  Active
                </label>
              </div>
            </div>

            <Card ref={editFormRef} className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">
                  {editingIndex === null ? "Add Question" : "Edit Question"}
                </CardTitle>
                <CardDescription>
                  Quiz questions are authored here, including wrong-answer remediation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="question-text">Question</Label>
                  <Textarea
                    id="question-text"
                    rows={3}
                    value={draft.question}
                    onChange={(e) => updateDraft("question", e.target.value)}
                    placeholder="What is the ruling planet of Aries?"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="option-a">Option A</Label>
                    <Input
                      id="option-a"
                      value={draft.optionA}
                      onChange={(e) => updateDraft("optionA", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="option-b">Option B</Label>
                    <Input
                      id="option-b"
                      value={draft.optionB}
                      onChange={(e) => updateDraft("optionB", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="option-c">Option C</Label>
                    <Input
                      id="option-c"
                      value={draft.optionC}
                      onChange={(e) => updateDraft("optionC", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="option-d">Option D</Label>
                    <Input
                      id="option-d"
                      value={draft.optionD}
                      onChange={(e) => updateDraft("optionD", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="correct-answer">Correct Answer</Label>
                    <select
                      id="correct-answer"
                      value={draft.correct_answer}
                      onChange={(e) => updateDraft("correct_answer", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="0">Option A</option>
                      <option value="1">Option B</option>
                      <option value="2">Option C</option>
                      <option value="3">Option D</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="question-priority">Priority</Label>
                    <Input
                      id="question-priority"
                      type="number"
                      min="0"
                      value={draft.priority}
                      onChange={(e) => updateDraft("priority", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="question-explanation">Explanation</Label>
                  <Textarea
                    id="question-explanation"
                    rows={2}
                    value={draft.explanation}
                    onChange={(e) => updateDraft("explanation", e.target.value)}
                    placeholder="Optional explanation shown after an incorrect answer."
                  />
                </div>

                <div className="rounded-md border border-dashed bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Wrong-answer video remediation{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Configure the video segment that should replay when this question is
                      answered incorrectly.
                    </p>
                  </div>

                  {!remediationSupported && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                      Remediation columns are not available in the current database yet.
                      These values will not be saved until that migration is applied.
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rem-start">Start (seconds)</Label>
                      <Input
                        id="rem-start"
                        type="number"
                        min="0"
                        value={draft.remediation_start_seconds}
                        onChange={(e) =>
                          updateDraft("remediation_start_seconds", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rem-until">Replay until (seconds)</Label>
                      <Input
                        id="rem-until"
                        type="number"
                        min="0"
                        value={draft.remediation_replay_until_seconds}
                        onChange={(e) =>
                          updateDraft("remediation_replay_until_seconds", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rem-video-index">Video index</Label>
                      <Input
                        id="rem-video-index"
                        type="number"
                        min="0"
                        value={draft.remediation_video_index}
                        onChange={(e) =>
                          updateDraft("remediation_video_index", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Learners see the standard message: “That answer is not
                    correct. Replaying the relevant video segment, then you can
                    try again.”
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddOrUpdateQuestion}>
                    {editingIndex === null ? (
                      <>
                        <Plus className="size-4 mr-1.5" />
                        Add Question
                      </>
                    ) : (
                      <>
                        <Pencil className="size-4 mr-1.5" />
                        Update Question
                      </>
                    )}
                  </Button>
                  {editingIndex !== null && (
                    <Button type="button" variant="outline" onClick={resetDraft}>
                      Cancel edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Questions</h2>
                <Badge variant="outline">{form.questions.length}</Badge>
              </div>
              {form.questions.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  No questions added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.questions.map((question, index) => (
                    <Card key={`${question.question}-${index}`}>
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Q{index + 1}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Priority {question.priority}
                              </span>
                            </div>
                            <p className="font-medium">{question.question}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestion(index)}
                            >
                              <Pencil className="size-3.5 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(index)}
                            >
                              <Trash2 className="size-3.5 mr-1.5" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={`${option}-${optionIndex}`}
                              className="rounded-md border px-3 py-2 text-sm"
                            >
                              <span className="mr-2 text-muted-foreground">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {question.correct_answer === optionIndex && (
                                <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        {(question.remediation_start_seconds != null ||
                          question.remediation_replay_until_seconds != null) && (
                          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            Remediation:
                            {" "}
                            start {question.remediation_start_seconds ?? "—"}s,
                            until {question.remediation_replay_until_seconds ?? "—"}s,
                            video index {question.remediation_video_index ?? "—"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : submitLabel}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href={cancelHref}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
