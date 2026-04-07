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

type Program = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  is_active: boolean;
  allowed_roles: string[];
  created_at: string;
};

type Category = {
  id: string;
  training_id: string;
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Global search & status filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Category filters
  const [catCreatedFrom, setCatCreatedFrom] = useState("");
  const [catCreatedTo, setCatCreatedTo] = useState("");

  // Lesson filters
  const [lesCreatedFrom, setLesCreatedFrom] = useState("");
  const [lesCreatedTo, setLesCreatedTo] = useState("");

  // Preview modals
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [previewCat, setPreviewCat] = useState<Category | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  async function loadPrograms() {
    const res = await fetch("/api/admin/training/programs");
    if (res.ok) {
      const json = await res.json();
      setPrograms(json.programs ?? []);
    }
  }

  async function loadCategories(overrides?: { catCreatedFrom?: string; catCreatedTo?: string }) {
    const cf = overrides?.catCreatedFrom ?? catCreatedFrom;
    const ct = overrides?.catCreatedTo ?? catCreatedTo;
    const params = new URLSearchParams();
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    const res = await fetch(`/api/admin/training/categories?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCategories(json.categories ?? []);
    }
  }


  async function loadLessons(overrides?: { lesCreatedFrom?: string; lesCreatedTo?: string }) {
    const cf = overrides?.lesCreatedFrom ?? lesCreatedFrom;
    const ct = overrides?.lesCreatedTo ?? lesCreatedTo;
    const params = new URLSearchParams();
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
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
    await Promise.all([loadPrograms(), loadCategories(), loadLessons(), loadQuizzes()]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // Build lookup maps
  const programMap: Record<string, string> = {};
  for (const p of programs) { programMap[p.id] = p.name; }
  const categoryMap: Record<string, string> = {};
  for (const c of categories) { categoryMap[c.id] = c.name; }
  const lessonMap: Record<string, string> = {};
  for (const l of lessons) { lessonMap[l.id] = l.title; }

  // Derived filtered lists
  const s = searchTerm.toLowerCase();
  const matchStatus = (active: boolean) =>
    statusFilter === "all" || (statusFilter === "active" ? active : !active);

  const filteredPrograms = programs.filter(
    (p) => matchStatus(p.is_active) && (!s || p.name.toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s))
  );
  const filteredCategories = categories.filter(
    (c) => matchStatus(c.is_active) && (!s || c.name.toLowerCase().includes(s) || (c.description ?? "").toLowerCase().includes(s))
  );
  const filteredLessons = lessons.filter(
    (l) => matchStatus(l.is_active) && (!s || l.title.toLowerCase().includes(s) || (l.description ?? "").toLowerCase().includes(s))
  );
  const filteredQuizzes = quizzes.filter(
    (q) => matchStatus(q.is_active) && (!s || q.title.toLowerCase().includes(s))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Management</h1>
        <p className="text-muted-foreground">Manage training categories, lessons, and quizzes.</p>
      </div>

      {/* Search and Status Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Program preview modal */}
      {previewProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewProgram(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Program Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {previewProgram.name}</div>
              {previewProgram.description && <div><span className="font-medium">Description:</span> {previewProgram.description}</div>}
              <div><span className="font-medium">Priority:</span> {previewProgram.priority}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewProgram.is_active ? "default" : "outline"}>{previewProgram.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewProgram.created_at)}</div>
              <div><span className="font-medium">Categories:</span> {categories.filter((c) => c.training_id === previewProgram.id).length}</div>
              <div>
                <span className="font-medium">Access:</span>{" "}
                {!previewProgram.allowed_roles || previewProgram.allowed_roles.length === 0
                  ? "All authenticated users"
                  : previewProgram.allowed_roles.map((r) => r.replace(/^is_/, "")).join(", ")}
              </div>
              <Button size="sm" className="mt-2" onClick={() => setPreviewProgram(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category preview modal */}
      {previewCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewCat(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Category Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {previewCat.name}</div>
              <div><span className="font-medium">Program:</span> {programMap[previewCat.training_id] ?? "—"}</div>
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
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Quiz Preview</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="font-medium">Title:</span> {previewQuiz.title}</div>
              <div><span className="font-medium">Lesson:</span> {lessonMap[previewQuiz.lesson_id] ?? "—"}</div>
              <div><span className="font-medium">Pass Score:</span> {previewQuiz.pass_score != null ? `${previewQuiz.pass_score}%` : "—"}</div>
              <div><span className="font-medium">Status:</span> <Badge variant={previewQuiz.is_active ? "default" : "outline"}>{previewQuiz.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewQuiz.created_at)}</div>
              {Array.isArray(previewQuiz.questions) && previewQuiz.questions.length > 0 && (
                <div className="space-y-3 pt-1">
                  <p className="font-medium">Questions ({previewQuiz.questions.length}):</p>
                  {(previewQuiz.questions as Array<{ question?: string; text?: string; answers?: Array<{ text: string; is_correct?: boolean; correct?: boolean }> }>).map((q, qi) => (
                    <div key={qi} className="rounded-md border p-3 space-y-1.5">
                      <p className="font-medium text-sm">Q{qi + 1}: {q.question ?? q.text ?? "—"}</p>
                      {Array.isArray(q.answers) && q.answers.length > 0 && (
                        <ul className="space-y-1 pl-2">
                          {q.answers.map((a, ai) => (
                            <li key={ai} className={`text-xs flex items-center gap-1.5 ${(a.is_correct || a.correct) ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                              <span>{(a.is_correct || a.correct) ? "✓" : "○"}</span>
                              <span>{a.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" className="mt-2" onClick={() => setPreviewQuiz(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {/* Training Programs */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Training Programs</CardTitle>
            <CardDescription>{filteredPrograms.length} program{filteredPrograms.length === 1 ? "" : "s"}{searchTerm || statusFilter !== "all" ? ` (of ${programs.length})` : ""}</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/training/programs/new">+ Add Program</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {filteredPrograms.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{programs.length === 0 ? "No programs yet. Add one before creating categories." : "No programs match the current filters."}</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Access — Roles</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Categories</th>
                    <th className="px-3 py-2 text-left font-medium">Priority</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.map((prog) => (
                    <tr key={prog.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{prog.name}</td>
                      <td className="px-3 py-2">
                        {!prog.allowed_roles || prog.allowed_roles.length === 0 ? (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">All</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {prog.allowed_roles.map((r) => (
                              <Badge key={r} variant="outline" className="text-xs">{r.replace(/^is_/, "")}</Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate text-muted-foreground text-xs">{prog.description ?? "—"}</td>
                      <td className="px-3 py-2 text-sm">{categories.filter((c) => c.training_id === prog.id).length}</td>
                      <td className="px-3 py-2 text-sm">{prog.priority}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={prog.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {prog.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(prog.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewProgram(prog)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/training/programs/${prog.id}/edit`}>Edit</Link>
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

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{filteredCategories.length} categor{filteredCategories.length === 1 ? "y" : "ies"}{searchTerm || statusFilter !== "all" ? ` (of ${categories.length})` : ""}</CardDescription>
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
            <Button size="sm" onClick={() => loadCategories()}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { setCatCreatedFrom(""); setCatCreatedTo(""); loadCategories({ catCreatedFrom: "", catCreatedTo: "" }); }}>Reset</Button>
          </div>

          {filteredCategories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{categories.length === 0 ? "No categories yet. Add one to get started." : "No categories match the current filters."}</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Program</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Priority</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{cat.name}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{programMap[cat.training_id] ?? "—"}</td>
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
            <CardDescription>{filteredLessons.length} lesson{filteredLessons.length === 1 ? "" : "s"}{searchTerm || statusFilter !== "all" ? ` (of ${lessons.length})` : ""}</CardDescription>
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
            <Button size="sm" onClick={() => loadLessons()}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { setLesCreatedFrom(""); setLesCreatedTo(""); loadLessons({ lesCreatedFrom: "", lesCreatedTo: "" }); }}>Reset</Button>
          </div>

          {filteredLessons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{lessons.length === 0 ? "No lessons yet. Add one to get started." : "No lessons match the current filters."}</p>
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
                  {filteredLessons.map((lesson) => (
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
            <CardDescription>{filteredQuizzes.length} quiz{filteredQuizzes.length === 1 ? "" : "zes"}{searchTerm || statusFilter !== "all" ? ` (of ${quizzes.length})` : ""}</CardDescription>
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
          {filteredQuizzes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{quizzes.length === 0 ? "No quizzes yet. Add one to get started." : "No quizzes match the current filters."}</p>
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
                  {filteredQuizzes.map((quiz) => (
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
