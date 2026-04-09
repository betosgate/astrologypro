"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrainingNotes } from "@/components/admin/training-notes";

interface Lesson {
  id: string;
  title: string;
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [form, setForm] = useState({
    title: "",
    lesson_id: "",
    pass_score: "70",
    is_active: true,
    questions_json: "[]",
  });

  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [quizRes, lessonsRes] = await Promise.all([
          fetch(`/api/admin/training/quizzes/${id}`),
          fetch("/api/admin/training/lessons"),
        ]);

        if (!quizRes.ok) {
          toast.error("Quiz not found.");
          router.push("/admin/training");
          return;
        }

        const quizData = await quizRes.json();
        const lessonsData = lessonsRes.ok ? await lessonsRes.json() : { lessons: [] };

        const lessonList = lessonsData.lessons ?? [];
        setLessons(lessonList);

        const quiz = quizData.quiz;
        setForm({
          title: quiz.title ?? "",
          lesson_id: quiz.lesson_id ?? lessonList[0]?.id ?? "",
          pass_score: String(quiz.pass_score ?? 70),
          is_active: quiz.is_active ?? true,
          questions_json: JSON.stringify(quiz.questions ?? [], null, 2),
        });
      } catch {
        toast.error("Failed to load quiz.");
        router.push("/admin/training");
      } finally {
        setFetching(false);
      }
    }

    void load();
  }, [id, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (name === "questions_json") setJsonError(null);
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

    let parsedQuestions: unknown;
    try {
      parsedQuestions = JSON.parse(form.questions_json);
      if (!Array.isArray(parsedQuestions)) {
        setJsonError("Questions must be a JSON array.");
        return;
      }
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON. Please check the questions field.");
      return;
    }

    const passScore = parseInt(form.pass_score, 10);
    if (Number.isNaN(passScore) || passScore < 0 || passScore > 100) {
      toast.error("Pass score must be between 0 and 100.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          lesson_id: form.lesson_id,
          pass_score: passScore,
          is_active: form.is_active,
          questions: parsedQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update quiz.");
        return;
      }

      toast.success("Quiz updated.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this quiz? This cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/quizzes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete quiz.");
        return;
      }

      toast.success("Quiz deleted.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const exampleJson = JSON.stringify(
    [
      {
        question: "What is the ruling planet of Aries?",
        options: ["Mars", "Venus", "Jupiter", "Saturn"],
        answer: "Mars",
      },
    ],
    null,
    2,
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Edit Quiz</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Training Quiz</CardTitle>
          <CardDescription>
            Edit the quiz details, lesson assignment, and question payload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="lesson_id">
                Lesson <span className="text-red-500">*</span>
              </label>
              <select
                id="lesson_id"
                name="lesson_id"
                value={form.lesson_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                {lessons.length === 0 ? (
                  <option value="">No lessons available</option>
                ) : (
                  lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="pass_score">
                Pass Score (%)
              </label>
              <input
                id="pass_score"
                name="pass_score"
                type="number"
                min="0"
                max="100"
                value={form.pass_score}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="questions_json">
                Questions (JSON)
              </label>
              <textarea
                id="questions_json"
                name="questions_json"
                value={form.questions_json}
                onChange={handleChange}
                rows={12}
                spellCheck={false}
                className={`w-full rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring ${
                  jsonError ? "border-red-500" : "border-input"
                }`}
              />
              {jsonError && (
                <p className="text-xs text-red-500">{jsonError}</p>
              )}
              <details className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">
                  Example JSON format
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                  {exampleJson}
                </pre>
              </details>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="size-4 rounded border-input accent-primary"
              />
              Active
            </label>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Quiz
              </Button>
              <div className="flex items-center gap-2">
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/training">Cancel</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <TrainingNotes entityType="quiz" entityId={id} />
    </div>
  );
}
