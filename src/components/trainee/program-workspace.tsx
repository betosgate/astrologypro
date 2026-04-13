"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  LessonViewerClient,
  type LessonViewerProps,
} from "@/components/trainee/lesson-viewer-client";

// ─── Types (mirror the shape returned by /api/trainee/training/programs) ────

interface LessonSummary {
  id: string;
  title: string;
  description?: string | null;
  duration_mins?: number | null;
  priority: number;
  completed: boolean;
  quiz_passed: boolean | null;
  is_locked: boolean;
  lock_reason: string | null;
  // Optional progress hint surfaced by the API for "ongoing" detection.
  in_progress?: boolean;
}

interface CategorySummary {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  completed: boolean;
  is_locked: boolean;
  lock_reason: string | null;
  is_sequential: boolean;
  progress_pct: number;
  completed_lessons: number;
  total_lessons: number;
  next_lesson_id: string | null;
  next_lesson_title: string | null;
  lessons: LessonSummary[];
}

interface ProgramWorkspaceProps {
  programId: string;
  programName: string;
  categories: CategorySummary[];
  initialCategoryId: string | null;
  initialLessonId: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const INITIAL_CATEGORY_VISIBLE = 5;

// ─── Helpers ───────────────────────────────────────────────────────────────

function lessonStatus(lesson: LessonSummary): "completed" | "ongoing" | "not_started" {
  if (lesson.completed) return "completed";
  if (lesson.in_progress) return "ongoing";
  return "not_started";
}

const STATUS_LABEL: Record<ReturnType<typeof lessonStatus>, string> = {
  completed: "Completed",
  ongoing: "Ongoing",
  not_started: "Not Started",
};

const STATUS_BADGE: Record<ReturnType<typeof lessonStatus>, string> = {
  completed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  ongoing: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  not_started: "border-muted-foreground/30 text-muted-foreground",
};

// ─── Inline lesson viewer ─────────────────────────────────────────────────
// Fetches lesson detail client-side and renders LessonViewerClient inline
// inside the workspace panel so the learner can consume content without
// leaving the program workspace. sidebarLessons is passed as [] because
// the workspace itself provides category + lesson navigation.

function normalizeQuizOptions(options: unknown): { text: string }[] {
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (typeof option === "string") {
      const text = option.trim();
      return text ? [{ text }] : [];
    }
    if (
      option &&
      typeof option === "object" &&
      "text" in option &&
      typeof (option as { text: unknown }).text === "string"
    ) {
      const text = ((option as { text: string }).text).trim();
      return text ? [{ text }] : [];
    }
    return [];
  });
}

interface InlineLessonViewerProps {
  lessonId: string;
  programId: string;
  categoryId: string;
}

function InlineLessonViewer({
  lessonId,
  programId,
  categoryId,
}: InlineLessonViewerProps) {
  const [viewerProps, setViewerProps] = useState<LessonViewerProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trainee/training/lessons/${lessonId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? body.lock_reason ?? `HTTP ${res.status}`);
      }
      const { lesson } = await res.json();
      if (!lesson) throw new Error("Lesson not found.");

      // Build quiz questions — normalize options the same way the server page does.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quizQuestions = (lesson.quiz_questions ?? []).map((q: any) => ({
        id: q.id,
        question: q.question,
        options: normalizeQuizOptions(q.options),
        explanation: q.explanation ?? null,
        remediation_video_id: q.remediation_video_id ?? null,
        remediation_video_index: q.remediation_video_index ?? null,
        remediation_start_seconds: q.remediation_start_seconds ?? null,
        remediation_replay_until_seconds: q.remediation_replay_until_seconds ?? null,
        remediation_message: q.remediation_message ?? null,
      }));

      setViewerProps({
        lessonId,
        programId,
        categoryId,
        title: lesson.title ?? "",
        description: lesson.description ?? null,
        content: lesson.content ?? null,
        videoUrl: lesson.video_url ?? null,
        pdfUrl: lesson.pdf_url ?? null,
        durationMins: lesson.duration_mins ?? null,
        videos: lesson.videos ?? [],
        assets: lesson.assets ?? [],
        quizQuestions,
        quizPassed: lesson.quiz_passed === true,
        isCompleted: lesson.completed === true,
        // No deep-link routing from the inline viewer — the workspace handles
        // lesson progression via category/lesson selection.
        nextRoute: null,
        nextLabel: null,
        // Empty sidebar — the workspace IS the sidebar.
        sidebarLessons: [],
        triggers: lesson.triggers ?? [],
        lastPositionSeconds: lesson.last_position_seconds ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [lessonId, programId, categoryId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        Loading lesson…
      </div>
    );
  }

  if (error || !viewerProps) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive space-y-2">
        <p className="font-semibold">Could not load lesson</p>
        <p className="text-xs">{error ?? "Unknown error."}</p>
        <Button variant="outline" size="sm" onClick={fetchLesson}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <LessonViewerClient
      {...viewerProps}
      // Override the isCompleted callback path: when the quiz onPassed fires
      // inside the viewer, it sets local isCompleted. The LessonCompleteButton
      // then calls /api/…/complete. We hook into completion via the viewer's
      // existing fetch pattern — the parent polls or re-reads the program
      // hierarchy to reflect the new state.
      key={lessonId}
    />
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ProgramWorkspace({
  programId,
  categories,
  initialCategoryId,
  initialLessonId,
}: ProgramWorkspaceProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId,
  );
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    initialLessonId,
  );
  const [showAllCategories, setShowAllCategories] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, INITIAL_CATEGORY_VISIBLE);

  const hiddenCount = Math.max(0, categories.length - INITIAL_CATEGORY_VISIBLE);

  return (
    // Lessons are the primary working surface — they render on the LEFT and
    // get two-thirds of the width. Categories are secondary navigation —
    // they render on the RIGHT as a narrower rail. On small screens the
    // grid collapses and stacks naturally (lessons first via lg:order-1,
    // categories below via lg:order-2). See tasks/09.04.2026/
    // admin-module/training-school/02-learner-experience/
    // 02-move-program-workspace-lessons-left-and-categories-right.md.
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── RIGHT rail on desktop — categories pane (order: 2 everywhere)
          Sticky near the top so navigation stays visible while the learner
          scrolls the lessons pane. When the expanded rail is taller than
          the viewport it scrolls internally via overflow-y-auto so every
          category stays reachable. See tasks/09.04.2026/admin-module/
          training-school/02-learner-experience/
          03-progressively-reveal-large-category-lists-and-make-category
          -rail-sticky.md. */}
      <aside className="lg:col-span-1 order-2 space-y-2 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Categories
          </h2>
          <Badge variant="outline" className="text-xs">
            {categories.length}
          </Badge>
        </div>

        <ul className="space-y-1.5">
          {visibleCategories.map((cat, idx) => {
            const isSelected = cat.id === selectedCategoryId;
            const isLocked = cat.is_locked;

            const handleSelect = () => {
              if (isLocked) {
                toast.warning("Locked", {
                  description:
                    cat.lock_reason ??
                    "Complete the previous category first to unlock this section.",
                });
                return;
              }
              setSelectedCategoryId(cat.id);
              // Reset to the next lesson in the new category
              setExpandedLessonId(cat.next_lesson_id);
            };

            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={handleSelect}
                  className={[
                    "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30 hover:bg-muted/40",
                    isLocked ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium leading-snug truncate">
                          {cat.name}
                        </p>
                        {cat.completed ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        ) : isLocked ? (
                          <Lock className="size-3.5 shrink-0 text-muted-foreground/60" />
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {cat.completed_lessons}/{cat.total_lessons}
                        </span>
                        <Progress
                          value={cat.progress_pct}
                          className="h-1 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {hiddenCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowAllCategories((v) => !v)}
          >
            {showAllCategories
              ? "Show fewer categories"
              : `Show remaining ${hiddenCount}`}
          </Button>
        )}
      </aside>

      {/* ── LEFT 2/3 on desktop — lessons pane (order: 1 everywhere) ────── */}
      <section className="lg:col-span-2 order-1 space-y-3">
        {!selectedCategory ? (
          <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
            Select a category to see its lessons.
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h2 className="text-lg font-semibold">{selectedCategory.name}</h2>
                {selectedCategory.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {selectedCategory.completed_lessons}/
                {selectedCategory.total_lessons} lessons
              </Badge>
            </div>

            {selectedCategory.lessons.length === 0 ? (
              <div className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
                No lessons in this category yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedCategory.lessons.map((lesson, lIdx) => {
                  const status = lessonStatus(lesson);
                  const isExpanded = lesson.id === expandedLessonId;
                  const isLocked = lesson.is_locked;

                  const handleLessonToggle = () => {
                    if (isLocked) {
                      toast.warning("Locked", {
                        description:
                          lesson.lock_reason ??
                          "Complete the previous lesson first to continue in sequence.",
                      });
                      return;
                    }
                    setExpandedLessonId((cur) => (cur === lesson.id ? null : lesson.id));
                  };

                  return (
                    <li key={lesson.id}>
                      <div
                        className={[
                          "rounded-xl border bg-card transition-colors",
                          isExpanded ? "border-primary/40" : "",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={handleLessonToggle}
                          aria-disabled={isLocked}
                          className="w-full text-left p-4 flex items-start gap-3"
                        >
                          <div className="mt-0.5 shrink-0">
                            {status === "completed" ? (
                              <CheckCircle2 className="size-5 text-emerald-600" />
                            ) : isLocked ? (
                              <Lock className="size-5 text-muted-foreground/50" />
                            ) : status === "ongoing" ? (
                              <PlayCircle className="size-5 text-amber-600" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium">
                                <span className="text-muted-foreground/60 mr-2 tabular-nums text-xs">
                                  {String(lIdx + 1).padStart(2, "0")}.
                                </span>
                                {lesson.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={["text-xs shrink-0", STATUS_BADGE[status]].join(" ")}
                              >
                                {STATUS_LABEL[status]}
                              </Badge>
                            </div>
                            {lesson.duration_mins != null && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                <span>{lesson.duration_mins} min</span>
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground/60 mt-1 shrink-0" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground/60 mt-1 shrink-0" />
                          )}
                        </button>

                        {isExpanded && !isLocked && (
                          <div className="border-t px-4 py-4 space-y-4">
                            {/* Unlocked — inline lesson viewer replaces the deep-link CTA */}
                            <>
                              <InlineLessonViewer
                                lessonId={lesson.id}
                                programId={programId}
                                categoryId={selectedCategory.id}
                              />
                              <div className="flex justify-end pt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-xs text-muted-foreground gap-1.5"
                                >
                                  <Link
                                    href={`/trainee/training/${programId}/${selectedCategory.id}/${lesson.id}`}
                                  >
                                    <ExternalLink className="size-3" />
                                    Open full page
                                  </Link>
                                </Button>
                              </div>
                            </>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
