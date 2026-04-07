"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Lock,
  BookOpen,
  Music,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Flame,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskDef = {
  id: string;
  order: number;
  title: string;
  description?: string;
};

type TaskCompletion = { completed_at: string };

type FoundationWeek = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  audio_url: string | null;
  beto_photo_url: string | null;
  tasks: TaskDef[];
  unlocked: boolean;
  completed: boolean;
  completed_at: string | null;
  task_completions: Record<string, TaskCompletion>;
  tasks_done: number;
  tasks_total: number;
};

type FoundationData = {
  student: {
    id: string;
    status: string;
    enrolled_at: string;
    start_quarter: string;
  };
  weeks: FoundationWeek[];
  total_weeks: number;
  completed_count: number;
  q1_complete: boolean;
};

// ─── AudioPlayer ─────────────────────────────────────────────────────────────

function AudioPlayer({
  url,
  betoPhoto,
}: {
  url: string;
  betoPhoto: string | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/60 p-4">
      {betoPhoto ? (
        <img
          src={betoPhoto}
          alt="Beto"
          className="size-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Music className="size-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Weekly Audio Introduction
        </p>
        <audio controls className="w-full h-8" preload="none">
          <source src={url} />
          Your browser does not support audio playback.
        </audio>
      </div>
    </div>
  );
}

// ─── TaskChecklist ────────────────────────────────────────────────────────────

function TaskChecklist({
  week,
  onTaskComplete,
  completing,
}: {
  week: FoundationWeek;
  onTaskComplete: (weekNumber: number, taskId: string) => Promise<void>;
  completing: string | null; // task_id currently being saved
}) {
  if (week.tasks.length === 0) return null;

  // Sort tasks by order field
  const sorted = [...week.tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tasks — {week.tasks_done} of {week.tasks_total} complete
      </p>
      <ul className="space-y-2">
        {sorted.map((task) => {
          const done = !!week.task_completions[task.id];
          const isSaving = completing === task.id;

          return (
            <li
              key={task.id}
              className={`flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                done
                  ? "border-green-500/20 bg-green-50/20"
                  : "border-border bg-background"
              }`}
            >
              <button
                type="button"
                disabled={done || isSaving || !week.unlocked}
                onClick={() => onTaskComplete(week.week_number, task.id)}
                className="mt-0.5 shrink-0 disabled:cursor-default"
                aria-label={done ? `${task.title} complete` : `Complete ${task.title}`}
              >
                {isSaving ? (
                  <Circle className="size-4 animate-pulse text-primary" />
                ) : done ? (
                  <CheckSquare className="size-4 text-green-500" />
                ) : (
                  <Square className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.description}
                  </p>
                )}
                {done && week.task_completions[task.id]?.completed_at && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Completed{" "}
                    {new Date(
                      week.task_completions[task.id].completed_at
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── WeekCard ─────────────────────────────────────────────────────────────────

function WeekCard({
  week,
  onTaskComplete,
  completing,
}: {
  week: FoundationWeek;
  onTaskComplete: (weekNumber: number, taskId: string) => Promise<void>;
  completing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasContent =
    week.audio_url ||
    week.description ||
    (week.tasks && week.tasks.length > 0);

  const progressPct =
    week.tasks_total > 0
      ? Math.round((week.tasks_done / week.tasks_total) * 100)
      : week.completed
      ? 100
      : 0;

  return (
    <Card
      className={
        !week.unlocked
          ? "opacity-60"
          : week.completed
          ? "border-green-500/30 bg-green-50/20"
          : undefined
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {week.completed ? (
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
            ) : week.unlocked ? (
              <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm">Week {week.week_number}</CardTitle>
              <CardDescription className="text-xs font-medium mt-0.5">
                {week.title.replace(/^Week \d+ — /, "")}
              </CardDescription>
              {/* Inline task progress for unlocked/in-progress weeks */}
              {week.unlocked && !week.completed && week.tasks_total > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {week.tasks_done} of {week.tasks_total} tasks complete
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {week.completed && (
              <Badge variant="secondary" className="text-[10px]">
                Done
              </Badge>
            )}
            {week.unlocked && hasContent && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse week" : "Expand week"}
              >
                {expanded ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar for in-progress weeks */}
        {week.unlocked && !week.completed && week.tasks_total > 0 && (
          <Progress value={progressPct} className="h-1 mt-2" />
        )}
      </CardHeader>

      {expanded && week.unlocked && (
        <CardContent className="pt-0 space-y-4">
          {week.audio_url && (
            <AudioPlayer url={week.audio_url} betoPhoto={week.beto_photo_url} />
          )}

          {week.description && (
            <div className="prose prose-sm max-w-none text-sm text-foreground/80 whitespace-pre-wrap">
              {week.description}
            </div>
          )}

          {week.tasks.length > 0 && (
            <TaskChecklist
              week={week}
              onTaskComplete={onTaskComplete}
              completing={completing}
            />
          )}

          {week.completed && week.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed{" "}
              {new Date(week.completed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MysterySchoolTrainingPage() {
  const [data, setData] = useState<FoundationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null); // task_id

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/mystery-school/foundation");
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Failed to load training content");
    } else {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTaskComplete(weekNumber: number, taskId: string) {
    setCompleting(taskId);
    try {
      const res = await fetch("/api/mystery-school/foundation/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_number: weekNumber, task_id: taskId }),
      });
      if (res.ok) {
        // Optimistically update local state to avoid full reload flash
        setData((prev) => {
          if (!prev) return prev;
          const now = new Date().toISOString();
          const weeks = prev.weeks.map((w) => {
            if (w.week_number !== weekNumber) return w;
            const newCompletions = {
              ...w.task_completions,
              [taskId]: { completed_at: now },
            };
            const tasksDone = w.tasks.filter(
              (t) => !!newCompletions[t.id]
            ).length;
            const allDone =
              w.tasks_total > 0 && tasksDone >= w.tasks_total;
            return {
              ...w,
              task_completions: newCompletions,
              tasks_done: tasksDone,
              completed: allDone,
              completed_at: allDone ? now : w.completed_at,
            };
          });

          // Recompute unlock for the next week
          const updatedWeeks = weeks.map((w, idx) => {
            if (idx === 0) return { ...w, unlocked: true };
            const prev = weeks[idx - 1];
            const prevDone =
              prev.tasks_total === 0
                ? !!prev.completed_at
                : prev.tasks_done >= prev.tasks_total;
            return { ...w, unlocked: prevDone };
          });

          const completedCount = updatedWeeks.filter((w) => w.completed).length;
          const q1Complete =
            completedCount >= prev.total_weeks && updatedWeeks.length > 0;

          return {
            ...prev,
            weeks: updatedWeeks,
            completed_count: completedCount,
            q1_complete: q1Complete,
          };
        });
      }
    } finally {
      setCompleting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Mystery School Training</h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const progressPct =
    data.total_weeks > 0
      ? Math.round((data.completed_count / data.total_weeks) * 100)
      : 0;

  return (
    <div className="space-y-6">

      {/* ── Gold-standard hero header ─────────────────────────────────────── */}
      <div className="relative rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 via-background to-background px-6 py-8 shadow-sm">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <Flame className="size-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-500/70">
                  Mystery School — Foundation Q1
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Foundation Training
                </h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Your 12-week foundation in the sacred tradition. Work through each
              week in sequence — each week builds on the last.
            </p>
            {data.q1_complete && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-500">
                <CheckCircle2 className="size-4" />
                Foundation complete — your decan year is unlocked.
              </div>
            )}
          </div>

          {/* Quarter badge */}
          <div className="text-right space-y-1 shrink-0">
            <p className="text-xs text-muted-foreground">
              Quarter: <span className="font-medium capitalize text-foreground">{data.student.start_quarter}</span>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="size-3 text-yellow-500/70" />
              <span>
                Week {data.completed_count + (data.q1_complete ? 0 : 1)} of {data.total_weeks}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar inlined in hero */}
        <div className="relative mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{data.completed_count} of {data.total_weeks} weeks completed</span>
            <span className="font-medium text-foreground">{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-yellow-500/10 overflow-hidden border border-yellow-500/20">
            <div
              className="h-full rounded-full bg-yellow-500/70 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {data.weeks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 mx-auto mb-4">
              <BookOpen className="size-7 text-yellow-400/60" />
            </div>
            <p className="text-sm font-medium mb-1">Your journey begins when you enroll</p>
            <p className="text-sm text-muted-foreground">
              Foundation content is being prepared. Check back soon.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data.weeks.map((week) => (
          <WeekCard
            key={week.week_number}
            week={week}
            onTaskComplete={handleTaskComplete}
            completing={completing}
          />
        ))}
      </div>
    </div>
  );
}
