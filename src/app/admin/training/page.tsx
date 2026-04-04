"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
};

type Lesson = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_mins: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
};

type Quiz = {
  id: string;
  lesson_id: string;
  title: string;
  questions: unknown[];
  pass_score: number | null;
  is_active: boolean;
  created_at: string;
};

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function TrainingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Category filters
  const [catCreatedFrom, setCatCreatedFrom] = useState("");
  const [catCreatedTo, setCatCreatedTo] = useState("");

  // Lesson filters
  const [lesCreatedFrom, setLesCreatedFrom] = useState("");
  const [lesCreatedTo, setLesCreatedTo] = useState("");

  // Preview modals
  const [previewCat, setPreviewCat] = useState<Category | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  async function loadCategories() {
    const params = new URLSearchParams();
    if (catCreatedFrom) params.set("created_from", catCreatedFrom);
    if (catCreatedTo) params.set("created_to", catCreatedTo);
    const res = await fetch(`/api/admin/training/categories?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCategories(json.categories ?? []);
    }
  }

  async function loadLessons() {
    const params = new URLSearchParams();
    if (lesCreatedFrom) params.set("created_from", lesCreatedFrom);
    if (lesCreatedTo) params.set("created_to", lesCreatedTo);
    const res = await fetch(`/api/admin/training/lessons?${params}`);
    if (res.ok) {
      const json = await res.json();
      setLessons(json.lessons ?? []);
    }
  }

  async function loadQuizzes() {
    const res = await fetch("/api/admin/training/quizzes");
    if (res.ok) {
      const json = await res.json();
      setQuizzes(json.quizzes ?? []);
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadCategories(), loadLessons(), loadQuizzes()]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // Build lookup maps
  const categoryMap: Record<string, string> = {};
  for (const c of categories) { categoryMap[c.id] = c.name; }
  const lessonMap: Record<string, string> = {};
  for (const l of lessons) { lessonMap[l.id] = l.title; }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Management</h1>
        <p className="text-muted-foreground">Manage training categories, lessons, and quizzes.</p>
      </div>

      {/* Category preview modal */}
      {previewCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewCat(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Category Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {previewCat.name}</div>
              {previewCat.description && <div><span className="font-medium">Description:</span> {previewCat.description}</div>}
              <div><span className="font-medium">Priority:</span> {previewCat.priority}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewCat.is_active ? "default" : "outline"}>{previewCat.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewCat.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewCat(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson preview modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewLesson(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Lesson Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewLesson.title}</div>
              <div><span className="font-medium">Category:</span> {categoryMap[previewLesson.category_id] ?? "—"}</div>
              {previewLesson.description && <div><span className="font-medium">Description:</span> {previewLesson.description}</div>}
              {previewLesson.video_url && <div><span className="font-medium">Video URL:</span> <a href={previewLesson.video_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs break-all">{previewLesson.video_url}</a></div>}
              {previewLesson.duration_mins != null && <div><span className="font-medium">Duration:</span> {previewLesson.duration_mins} min</div>}
              <div><span className="font-medium">Priority:</span> {previewLesson.priority}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewLesson.is_active ? "default" : "outline"}>{previewLesson.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewLesson.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewLesson(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz preview modal */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewQuiz(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Quiz Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {previewQuiz.title}</div>
              <div><span className="font-medium">Lesson:</span> {lessonMap[previewQuiz.lesson_id] ?? "—"}</div>
              <div><span className="font-medium">Pass Score:</span> {previewQuiz.pass_score != null ? `${previewQuiz.pass_score}%` : "—"}</div>
              <div><span className="font-medium">Questions:</span> {Array.isArray(previewQuiz.questions) ? previewQuiz.questions.length : "—"}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewQuiz.is_active ? "default" : "outline"}>{previewQuiz.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewQuiz.created_at)}</div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewQuiz(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{categories.length} categor{categories.length === 1 ? "y" : "ies"}</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/training/categories/new">+ Add Category</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category date filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={catCreatedFrom} onChange={(e) => setCatCreatedFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={catCreatedTo} onChange={(e) => setCatCreatedTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={loadCategories}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { setCatCreatedFrom(""); setCatCreatedTo(""); setTimeout(loadCategories, 0); }}>Reset</Button>
          </div>

          {categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No categories yet. Add one to get started.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Priority</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{cat.name}</td>
                      <td className="px-3 py-2 max-w-xs truncate text-muted-foreground text-xs">{cat.description ?? "—"}</td>
                      <td className="px-3 py-2 text-sm">{cat.priority ?? 0}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={cat.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {cat.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(cat.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewCat(cat)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/training/categories/${cat.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/training/lessons/new">+ Add Lesson</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lesson date filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={lesCreatedFrom} onChange={(e) => setLesCreatedFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={lesCreatedTo} onChange={(e) => setLesCreatedTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={loadLessons}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { setLesCreatedFrom(""); setLesCreatedTo(""); setTimeout(loadLessons, 0); }}>Reset</Button>
          </div>

          {lessons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No lessons yet. Add one to get started.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Title</th>
                    <th className="px-3 py-2 text-left font-medium">Category</th>
                    <th className="px-3 py-2 text-left font-medium">Duration</th>
                    <th className="px-3 py-2 text-left font-medium">Priority</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{lesson.title}</td>
                      <td className="px-3 py-2 text-muted-foreground text-sm">{categoryMap[lesson.category_id] ?? "—"}</td>
                      <td className="px-3 py-2 text-sm">{lesson.duration_mins != null ? `${lesson.duration_mins} min` : "—"}</td>
                      <td className="px-3 py-2 text-sm">{lesson.priority ?? 0}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={lesson.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {lesson.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(lesson.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewLesson(lesson)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/training/lessons/${lesson.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quizzes */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Quizzes</CardTitle>
            <CardDescription>{quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/training/quiz-generate">✨ AI Generate</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/training/quizzes/new">+ Add Quiz</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No quizzes yet. Add one to get started.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Title</th>
                    <th className="px-3 py-2 text-left font-medium">Lesson</th>
                    <th className="px-3 py-2 text-left font-medium">Pass Score</th>
                    <th className="px-3 py-2 text-left font-medium">Questions</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{quiz.title}</td>
                      <td className="px-3 py-2 text-muted-foreground text-sm">{lessonMap[quiz.lesson_id] ?? "—"}</td>
                      <td className="px-3 py-2 text-sm">{quiz.pass_score != null ? `${quiz.pass_score}%` : "—"}</td>
                      <td className="px-3 py-2 text-sm">{Array.isArray(quiz.questions) ? quiz.questions.length : "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={quiz.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {quiz.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(quiz.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewQuiz(quiz)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/training/quizzes/${quiz.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
