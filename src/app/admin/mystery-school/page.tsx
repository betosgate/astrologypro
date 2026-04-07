"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Save, Eye, EyeOff, Plus, Trash2, GripVertical } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskDef = {
  id: string;
  order: number;
  title: string;
  description?: string;
};

type FoundationWeek = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  content: string | null;
  audio_url: string | null;
  beto_photo_url: string | null;
  tasks: TaskDef[];
  is_published: boolean;
};

type FormState = {
  title: string;
  description: string;
  audio_url: string;
  beto_photo_url: string;
  tasks: TaskDef[];
  is_published: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newTaskId(): string {
  return crypto.randomUUID();
}

function reorder(tasks: TaskDef[]): TaskDef[] {
  return tasks.map((t, i) => ({ ...t, order: i + 1 }));
}

// ─── TaskEditor ───────────────────────────────────────────────────────────────

function TaskEditor({
  tasks,
  onChange,
}: {
  tasks: TaskDef[];
  onChange: (tasks: TaskDef[]) => void;
}) {
  function addTask() {
    const next: TaskDef = {
      id: newTaskId(),
      order: tasks.length + 1,
      title: "",
      description: "",
    };
    onChange([...tasks, next]);
  }

  function removeTask(id: string) {
    onChange(reorder(tasks.filter((t) => t.id !== id)));
  }

  function updateTask(id: string, field: "title" | "description", value: string) {
    onChange(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function moveTask(index: number, direction: -1 | 1) {
    const next = [...tasks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(reorder(next));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Tasks ({tasks.length})</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7"
          onClick={addTask}
        >
          <Plus className="size-3.5 mr-1" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No tasks yet. Add tasks below — students must complete all of them to
          finish the week.
        </p>
      )}

      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className="rounded-md border bg-muted/30 p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                {task.order}
              </span>
              <Input
                value={task.title}
                onChange={(e) => updateTask(task.id, "title", e.target.value)}
                placeholder="Task title"
                className="h-7 text-sm flex-1"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={idx === 0}
                  onClick={() => moveTask(idx, -1)}
                  aria-label="Move task up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={idx === tasks.length - 1}
                  onClick={() => moveTask(idx, 1)}
                  aria-label="Move task down"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => removeTask(task.id)}
                  aria-label="Remove task"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <Input
              value={task.description ?? ""}
              onChange={(e) =>
                updateTask(task.id, "description", e.target.value)
              }
              placeholder="Optional task description"
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMysterySchoolPage() {
  const [weeks, setWeeks] = useState<FoundationWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    audio_url: "",
    beto_photo_url: "",
    tasks: [],
    is_published: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/mystery-school/foundation")
      .then((r) => r.json())
      .then((d) => setWeeks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(week: FoundationWeek) {
    setEditingId(week.id);
    setForm({
      title: week.title,
      description: week.description ?? "",
      audio_url: week.audio_url ?? "",
      beto_photo_url: week.beto_photo_url ?? "",
      tasks: Array.isArray(week.tasks) ? week.tasks : [],
      is_published: week.is_published,
    });
    setError(null);
  }

  async function handleSave(id: string) {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        audio_url: form.audio_url || null,
        beto_photo_url: form.beto_photo_url || null,
        tasks: reorder(form.tasks).map((t) => ({
          id: t.id,
          order: t.order,
          title: t.title,
          ...(t.description ? { description: t.description } : {}),
        })),
        is_published: form.is_published,
      };
      const res = await fetch(`/api/admin/mystery-school/foundation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          (data as { error?: string }).error ?? "Failed to save"
        );
      }
      const updated = await res.json();
      setWeeks((prev) => prev.map((w) => (w.id === id ? updated : w)));
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(week: FoundationWeek) {
    const res = await fetch(`/api/admin/mystery-school/foundation/${week.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !week.is_published }),
    });
    if (res.ok) {
      const updated = await res.json();
      setWeeks((prev) => prev.map((w) => (w.id === week.id ? updated : w)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Mystery School</h1>
            <a
              href="/admin/mystery-school/decans"
              className="text-sm text-primary hover:underline"
            >
              → Decan Rituals (36)
            </a>
            <a
              href="/admin/mystery-school/students"
              className="text-sm text-primary hover:underline"
            >
              → Students
            </a>
            <a
              href="/admin/mystery-school/journals"
              className="text-sm text-primary hover:underline"
            >
              → Student Journals
            </a>
          </div>
          <p className="text-muted-foreground">
            Foundation Weeks — manage content, audio, and task checklists.
          </p>
        </div>
        <Badge variant="secondary">
          {weeks.filter((w) => w.is_published).length} / {weeks.length}{" "}
          published
        </Badge>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) => {
            const taskCount = Array.isArray(week.tasks) ? week.tasks.length : 0;
            return (
              <Card key={week.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {week.week_number}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{week.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {week.audio_url ? "Audio set" : "No audio"} ·{" "}
                          {week.description ? "Description set" : "No description"} ·{" "}
                          {taskCount > 0
                            ? `${taskCount} task${taskCount !== 1 ? "s" : ""}`
                            : "No tasks"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={week.is_published ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {week.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => togglePublish(week)}
                        title={week.is_published ? "Unpublish" : "Publish"}
                      >
                        {week.is_published ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() =>
                          editingId === week.id
                            ? setEditingId(null)
                            : startEdit(week)
                        }
                      >
                        {editingId === week.id ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {editingId === week.id && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={form.title}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description (shown to students above tasks)</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        rows={5}
                        placeholder="Enter the week's reading material, instructions, and reflection prompts…"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Audio URL (mp3 / storage URL)</Label>
                      <Input
                        value={form.audio_url}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, audio_url: e.target.value }))
                        }
                        placeholder="https://…"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Beto Photo URL (optional)</Label>
                      <Input
                        value={form.beto_photo_url}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            beto_photo_url: e.target.value,
                          }))
                        }
                        placeholder="https://…"
                      />
                    </div>

                    {/* Task list editor */}
                    <div className="rounded-md border p-4 space-y-3">
                      <TaskEditor
                        tasks={form.tasks}
                        onChange={(tasks) =>
                          setForm((f) => ({ ...f, tasks }))
                        }
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSave(week.id)}
                      disabled={saving}
                    >
                      <Save className="mr-1.5 size-3.5" />
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
