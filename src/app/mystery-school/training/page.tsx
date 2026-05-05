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
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Flame,
  Star,
  PlayCircle,
  FileText,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

/**
 * Mystery School Foundation learner page (Training-backed).
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v3.md
 *   §1 Make Admin Training the only normal Foundation content source.
 *   §2 Keep all Foundation progress in Training tables.
 *
 * Source of truth:
 *   • Curriculum  → /api/mystery-school/training/foundation
 *                   (training_programs / training_categories / training_lessons)
 *   • Progress    → lesson_progress, lesson_completions, category_completions
 *
 * Removed in v3:
 *   • Legacy fallback to /api/mystery-school/foundation
 *   • LegacyWeekCard / TaskChecklist / handleTaskComplete
 *   • Calls to /api/mystery-school/foundation/complete-task
 *
 * If the Training program or its lessons are missing, this page renders an
 * explicit "setup pending" empty state so admins can see the gap and
 * populate Admin Training. It does NOT silently fall back to the legacy
 * Foundation editor.
 */

// ─── Training-backed types ───────────────────────────────────────────────────

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

// ─── LessonList ──────────────────────────────────────────────────────────────

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
              ) : lesson.audio_url && !lesson.video_url && !lesson.pdf_url ? (
                <Music className="size-4 text-primary" />
              ) : lesson.video_url && !lesson.audio_url && !lesson.pdf_url ? (
                <PlayCircle className="size-4 text-primary" />
              ) : lesson.pdf_url && !lesson.audio_url && !lesson.video_url ? (
                <FileText className="size-4 text-primary" />
              ) : (
                <BookOpen className="size-4 text-primary" />
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

// ─── Shared WeekCard shell ───────────────────────────────────────────────────

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

// ─── Setup-pending empty state ───────────────────────────────────────────────

function FoundationSetupPendingState({
  programPresent,
}: {
  programPresent: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="relative rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 via-background to-background px-6 py-8 shadow-sm">
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
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 mx-auto mb-4">
            <BookOpen className="size-7 text-yellow-400/60" />
          </div>
          <p className="text-sm font-medium mb-1">
            Foundation content is being prepared
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {programPresent
              ? "The 12-week curriculum exists, but no lessons have been published yet. Please check back soon — your guides are finishing this material now."
              : "The Foundation program has not been published yet. Please check back soon — your guides are finishing this material now."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MysterySchoolTrainingPage() {
  const [data, setData] = useState<TrainingFoundationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mystery-school/training/foundation");
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Failed to load Foundation content");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as TrainingFoundationData;
      setData(json);
    } catch {
      setError("Failed to load Foundation content");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const heroData = useMemo(() => {
    if (!data) return null;
    return {
      student: data.student,
      total_weeks: data.total_weeks,
      completed_count: data.completed_count,
      q1_complete: data.q1_complete,
    };
  }, [data]);

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

  if (!data || !heroData) return null;

  // Setup-pending: Training program missing OR no lessons published yet.
  // We show a clear empty state instead of falling back to the legacy
  // /api/mystery-school/foundation path (removed in v3).
  const totalLessons = data.weeks.reduce(
    (sum, w) => sum + w.lessons_total,
    0
  );
  if (!data.program_present || totalLessons === 0) {
    return (
      <FoundationSetupPendingState programPresent={data.program_present} />
    );
  }

  const progressPct =
    heroData.total_weeks > 0
      ? Math.round((heroData.completed_count / heroData.total_weeks) * 100)
      : 0;

  const weekCount = data.weeks.length;

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
        {data.weeks.map((week) => (
          <TrainingWeekCard key={week.id} week={week} />
        ))}
      </div>
    </div>
  );
}
