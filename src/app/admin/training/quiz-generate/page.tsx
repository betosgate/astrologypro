"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Upload,
  Check,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

type Option = { text: string; correct: boolean };
type Question = { question: string; options: Option[] };

export default function QuizGeneratePage() {
  const [lessons, setLessons] = useState<{ id: string; title: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [title, setTitle] = useState("");
  const [passScore, setPassScore] = useState(70);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/training/lessons")
      .then((r) => r.json())
      .then((d) => setLessons(d.lessons ?? []))
      .catch(() => {});
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setGenerating(true);
    setError(null);
    setDraftId(null);
    setQuestions([]);
    setSuccess(false);

    const form = new FormData();
    form.append("file", file);
    if (lessonId) form.append("lessonId", lessonId);
    form.append("questionCount", String(questionCount));

    const res = await fetch("/api/admin/quiz-generate", {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Generation failed");
    } else {
      setDraftId(data.draftId);
      setQuestions(data.questions as Question[]);
      if (!title) {
        setTitle(`${file.name.replace(/\.pptx$/i, "")} Quiz`);
      }
    }
    setGenerating(false);
  }

  function updateQuestion(idx: number, q: Question) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = q;
      return next;
    });
  }

  function setCorrect(qIdx: number, oIdx: number) {
    updateQuestion(qIdx, {
      ...questions[qIdx],
      options: questions[qIdx].options.map((o, i) => ({
        ...o,
        correct: i === oIdx,
      })),
    });
  }

  function updateOptionText(qIdx: number, oIdx: number, text: string) {
    const q = { ...questions[qIdx] };
    q.options = q.options.map((o, i) => (i === oIdx ? { ...o, text } : o));
    updateQuestion(qIdx, q);
  }

  function updateQuestionText(qIdx: number, text: string) {
    updateQuestion(qIdx, { ...questions[qIdx], question: text });
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: [
          { text: "", correct: true },
          { text: "", correct: false },
          { text: "", correct: false },
          { text: "", correct: false },
        ],
      },
    ]);
    setExpandedIdx(questions.length);
  }

  async function handleSave() {
    if (!draftId) return;
    if (!lessonId) {
      setError("Please select a lesson before saving.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/quiz-drafts/${draftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions, title, lessonId, passScore }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Save failed");
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleDiscard() {
    if (!draftId) return;
    await fetch(`/api/admin/quiz-drafts/${draftId}`, { method: "DELETE" });
    setDraftId(null);
    setQuestions([]);
    setSuccess(false);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">AI Quiz Generator</h1>
          </div>
          <p className="text-muted-foreground">
            Upload a PPTX lesson presentation — Claude will generate quiz questions automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/training">← Training</Link>
        </Button>
      </div>

      {/* Upload form */}
      {!questions.length && !success && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Presentation</CardTitle>
            <CardDescription>
              Supported format: .pptx — text is extracted from all slides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="space-y-2">
                <Label>Presentation file (.pptx)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assign to lesson (optional)</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                  >
                    <option value="">— unassigned —</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Number of questions (max 20)</Label>
                  <Input
                    type="number"
                    min={3}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={generating || !file}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating questions…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    Generate Questions
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {success && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-5">
            <Check className="size-6 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-primary">Quiz saved successfully!</p>
              <p className="text-sm text-muted-foreground">
                The quiz is now live for the assigned lesson.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSuccess(false);
                setDraftId(null);
                setQuestions([]);
                setFile(null);
                setTitle("");
                setLessonId("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Generate Another
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review questions */}
      {questions.length > 0 && !success && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Review Generated Questions</CardTitle>
                  <CardDescription>
                    {questions.length} question{questions.length !== 1 ? "s" : ""} generated — edit as needed before saving
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscard}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="mr-1.5 size-3.5" />
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 size-4" />
                    )}
                    Save Quiz
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quiz metadata */}
              <div className="grid gap-4 sm:grid-cols-3 border-b pb-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Quiz title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Quiz title"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pass score (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={passScore}
                    onChange={(e) => setPassScore(parseInt(e.target.value) || 70)}
                  />
                </div>
                {!lessonId && (
                  <div className="space-y-1 sm:col-span-3">
                    <Label>Lesson (required to save)</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={lessonId}
                      onChange={(e) => setLessonId(e.target.value)}
                    >
                      <option value="">— select lesson —</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Questions list */}
              {questions.map((q, qIdx) => {
                const isOpen = expandedIdx === qIdx;
                const hasCorrect = q.options.some((o) => o.correct);
                return (
                  <div key={qIdx} className="rounded-lg border">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                      onClick={() =>
                        setExpandedIdx(isOpen ? null : qIdx)
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant={hasCorrect ? "default" : "destructive"}
                          className="shrink-0 text-xs"
                        >
                          Q{qIdx + 1}
                        </Badge>
                        <span className="truncate text-sm font-medium">
                          {q.question || "(empty question)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(qIdx);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                        {isOpen ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="space-y-4 border-t px-4 py-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Question</Label>
                          <Input
                            value={q.question}
                            onChange={(e) =>
                              updateQuestionText(qIdx, e.target.value)
                            }
                            placeholder="Enter question text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Options — click radio to mark correct
                          </Label>
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={[
                                "flex items-center gap-3 rounded-md border px-3 py-2",
                                opt.correct
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name={`q-${qIdx}-correct`}
                                checked={opt.correct}
                                onChange={() => setCorrect(qIdx, oIdx)}
                                className="shrink-0"
                              />
                              <Input
                                value={opt.text}
                                onChange={(e) =>
                                  updateOptionText(qIdx, oIdx, e.target.value)
                                }
                                placeholder={`Option ${oIdx + 1}`}
                                className="border-0 bg-transparent px-0 focus-visible:ring-0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
              >
                <Plus className="mr-2 size-4" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
