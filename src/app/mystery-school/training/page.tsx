"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

// ─── Legacy (foundation_weeks) types ─────────────────────────────────────────

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

// ─── Training-backed (new) types ─────────────────────────────────────────────

type TrainingWeekLesson = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  duration_mins: number | null;
  priority: number;
  completed: boolean;
  completed_at: string | null;
};

type TrainingWeek = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  unlocked: boolean;
  completed: boolean;
  completed_at: string | null;
  lessons: TrainingWeekLesson[];
  lessons_done: number;
  lessons_total: number;
};

type TrainingFoundationData = {
  student: {
    id: string;
    status: string;
    enrolled_at: string;
    start_quarter: string;
  };
  weeks: TrainingWeek[];
  total_weeks: number;
  completed_count: number;
  q1_complete: boolean;
  source: "training";
  program_present: boolean;
};

// ─── AudioPlayer (legacy) ────────────────────────────────────────────────────

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

// ─── TaskChecklist (legacy) ──────────────────────────────────────────────────

function TaskChecklist({
  week,
  onTaskComplete,
  completing,
}: {
  week: FoundationWeek;
  onTaskComplete: (weekNumber: number, taskId: string) => Promise<void>;
  completing: string | null;
}) {
  if (week.tasks.length === 0) return null;
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

// ─── LessonList (training-backed) ────────────────────────────────────────────

function LessonList({ week }: { week: TrainingWeek }) {
  if (week.lessons.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No lessons published in this week yet.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Lessons — {week.lessons_done} of {week.lessons_total} complete
      </p>
      <ul className="space-y-2">
        {week.lessons.map((lesson, idx) => (
          <li
            key={lesson.id}
            className={`flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors ${
              lesson.completed
                ? "border-green-500/20 bg-green-50/20"
                : "border-border bg-background"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {lesson.completed ? (
                <CheckSquare className="size-4 text-green-500" />
              ) : (
                <PlayCircle className="size-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  lesson.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                Lesson {idx + 1} — {lesson.title}
              </p>
              {lesson.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lesson.description}
                </p>
              )}
              {lesson.duration_mins != null && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lesson.duration_mins} min
                </p>
              )}
            </div>
            <div className="shrink-0">
              <Button size="sm" asChild disabled={!week.unlocked}>
                <Link
                  href={`/mystery-school/training/${week.id}/${lesson.id}`}
                  aria-disabled={!week.unlocked}
                >
                  {lesson.completed ? "Review" : "Open"}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Shared WeekCard (legacy + training share the visual shell) ──────────────

type SharedWeekDisplay = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  unlocked: boolean;
  completed: boolean;
  completed_at: string | null;
  units_done: number;
  units_total: number;
  // Optional legacy-only fields
  audio_url: string | null;
  beto_photo_url: string | null;
};

function WeekCardShell({
  display,
  expanded,
  onToggle,
  hasContent,
  children,
}: {
  display: SharedWeekDisplay;
  expanded: boolean;
  onToggle: () => void;
  hasContent: boolean;
  children: React.ReactNode;
}) {
  const progressPct =
    display.units_total > 0
      ? Math.round((display.units_done / display.units_total) * 100)
      : display.completed
      ? 100
      : 0;

  return (
    <Card
      className={
        !display.unlocked
          ? "opacity-60"
          : display.completed
          ? "border-green-500/30 bg-green-50/20"
          : undefined
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {display.completed ? (
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
            ) : display.unlocked ? (
              <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm">
                Week {display.week_number}
              </CardTitle>
              <CardDescription className="text-xs font-medium mt-0.5">
                {display.title.replace(/^Week \d+ — /, "")}
              </CardDescription>
              {display.unlocked && !display.completed && display.units_total > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {display.units_done} of {display.units_total} complete
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {display.completed && (
              <Badge variant="secondary" className="text-[10px]">
                Done
              </Badge>
            )}
            {display.unlocked && hasContent && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onToggle}
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

        {display.unlocked && !display.completed && display.units_total > 0 && (
          <Progress value={progressPct} className="h-1 mt-2" />
        )}
      </CardHeader>

      {expanded && display.unlocked && (
        <CardContent className="pt-0 space-y-4">
          {children}
          {display.completed && display.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed{" "}
              {new Date(display.completed_at).toLocaleDateString("en-US", {
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

function LegacyWeekCard({
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
    !!week.audio_url ||
    !!week.description ||
    (week.tasks && week.tasks.length > 0);

  const display: SharedWeekDisplay = {
    id: week.id,
    week_number: week.week_number,
    title: week.title,
    description: week.description,
    unlocked: week.unlocked,
    completed: week.completed,
    completed_at: week.completed_at,
    units_done: week.tasks_done,
    units_total: week.tasks_total,
    audio_url: week.audio_url,
    beto_photo_url: week.beto_photo_url,
  };

  return (
    <WeekCardShell
      display={display}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      hasContent={hasContent}
    >
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
    </WeekCardShell>
  );
}

function TrainingWeekCard({ week }: { week: TrainingWeek }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent =
    !!week.description || (week.lessons && week.lessons.length > 0);

  const display: SharedWeekDisplay = {
    id: week.id,
    week_number: week.week_number,
    title: week.title,
    description: week.description,
    unlocked: week.unlocked,
    completed: week.completed,
    completed_at: week.completed_at,
    units_done: week.lessons_done,
    units_total: week.lessons_total,
    audio_url: null,
    beto_photo_url: null,
  };

  return (
    <WeekCardShell
      display={display}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      hasContent={hasContent}
    >
      {week.description && (
        <div className="prose prose-sm max-w-none text-sm text-foreground/80 whitespace-pre-wrap">
          {week.description}
        </div>
      )}
      <LessonList week={week} />
    </WeekCardShell>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type DataSource = "training" | "legacy";

type Loaded =
  | { source: "training"; data: TrainingFoundationData }
  | { source: "legacy"; data: FoundationData };

export default function MysterySchoolTrainingPage() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  /**
   * Adapter-first load with graceful fallback.
   *
   * 1. Try /api/mystery-school/training/foundation. If it returns weeks with
   *    at least one lesson across them, render the new training-backed UI.
   * 2. Otherwise fall back to /api/mystery-school/foundation (legacy weeks
   *    table) so production never goes blank during the transition.
   *
   * This keeps the page working in three states:
   *   - migration not yet run → adapter 200 with empty program → fallback
   *   - migration ran but no lessons added → fallback (preserves legacy UX)
   *   - migration ran + admin added lessons → new training-backed UI
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let trainingData: TrainingFoundationData | null = null;
    try {
      const res = await fetch("/api/mystery-school/training/foundation");
      if (res.ok) {
        const json = (await res.json()) as TrainingFoundationData;
        trainingData = json;
      }
    } catch {
      // Network or parse error — silently fall through to legacy.
    }

    const totalLessons =
      trainingData?.weeks.reduce((sum, w) => sum + w.lessons_total, 0) ?? 0;
    const useTraining =
      !!trainingData &&
      trainingData.program_present &&
      totalLessons > 0;

    if (useTraining && trainingData) {
      setLoaded({ source: "training", data: trainingData });
      setLoading(false);
      return;
    }

    // Legacy fallback.
    try {
      const res = await fetch("/api/mystery-school/foundation");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          (j as { error?: string }).error ?? "Failed to load training content"
        );
        setLoading(false);
        return;
      }
      const data = (await res.json()) as FoundationData;
      setLoaded({ source: "legacy", data });
    } catch {
      setError("Failed to load training content");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTaskComplete(weekNumber: number, taskId: string) {
    setCompleting(taskId);
    try {
      const res = await fetch(
        "/api/mystery-school/foundation/complete-task",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ week_number: weekNumber, task_id: taskId }),
        }
      );
      if (res.ok) {
        // Optimistic update only meaningful for legacy data
        setLoaded((prev) => {
          if (!prev || prev.source !== "legacy") return prev;
          const now = new Date().toISOString();
          const weeks = prev.data.weeks.map((w) => {
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
          const updatedWeeks = weeks.map((w, idx) => {
            if (idx === 0) return { ...w, unlocked: true };
            const prevWeek = weeks[idx - 1];
            const prevDone =
              prevWeek.tasks_total === 0
                ? !!prevWeek.completed_at
                : prevWeek.tasks_done >= prevWeek.tasks_total;
            return { ...w, unlocked: prevDone };
          });
          const completedCount = updatedWeeks.filter((w) => w.completed).length;
          const q1Complete =
            completedCount >= prev.data.total_weeks &&
            updatedWeeks.length > 0;
          return {
            source: "legacy",
            data: {
              ...prev.data,
              weeks: updatedWeeks,
              completed_count: completedCount,
              q1_complete: q1Complete,
            },
          };
        });
      }
    } finally {
      setCompleting(null);
    }
  }

  // Common derived values for the hero
  const heroData = useMemo(() => {
    if (!loaded) return null;
    return {
      student: loaded.data.student,
      total_weeks: loaded.data.total_weeks,
      completed_count: loaded.data.completed_count,
      q1_complete: loaded.data.q1_complete,
    };
  }, [loaded]);

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

  if (!loaded || !heroData) return null;

  const progressPct =
    heroData.total_weeks > 0
      ? Math.round((heroData.completed_count / heroData.total_weeks) * 100)
      : 0;

  const weekCount = loaded.data.weeks.length;
  const sourceLabel: DataSource = loaded.source;

  return (
    <div className="space-y-6">
      {/* Hero header */}
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
              Your 12-week foundation in the sacred tradition. Work through
              each week in sequence — each week builds on the last.
            </p>
            {heroData.q1_complete && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-500">
                <CheckCircle2 className="size-4" />
                Foundation complete — your decan year is unlocked.
              </div>
            )}
          </div>

          <div className="text-right space-y-1 shrink-0">
            <p className="text-xs text-muted-foreground">
              Quarter:{" "}
              <span className="font-medium capitalize text-foreground">
                {heroData.student.start_quarter}
              </span>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="size-3 text-yellow-500/70" />
              <span>
                Week{" "}
                {heroData.completed_count + (heroData.q1_complete ? 0 : 1)} of{" "}
                {heroData.total_weeks}
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {heroData.completed_count} of {heroData.total_weeks} weeks
              completed
            </span>
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

      {weekCount === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 mx-auto mb-4">
              <BookOpen className="size-7 text-yellow-400/60" />
            </div>
            <p className="text-sm font-medium mb-1">
              Your journey begins when you enroll
            </p>
            <p className="text-sm text-muted-foreground">
              Foundation content is being prepared. Check back soon.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sourceLabel === "training"
          ? (loaded.data as TrainingFoundationData).weeks.map((week) => (
              <TrainingWeekCard key={week.id} week={week} />
            ))
          : (loaded.data as FoundationData).weeks.map((week) => (
              <LegacyWeekCard
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
