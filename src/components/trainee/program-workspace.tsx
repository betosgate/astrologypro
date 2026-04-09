"use client";

import { useState, useMemo } from "react";
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
  Lock,
  PlayCircle,
} from "lucide-react";
import { LockedLink } from "@/components/trainee/locked-link";
import { toast } from "sonner";

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
      {/* ── RIGHT rail on desktop — categories pane (order: 2 everywhere) ── */}
      <aside className="lg:col-span-1 order-2 space-y-2 lg:sticky lg:top-6 lg:self-start">
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
                          onClick={() =>
                            setExpandedLessonId((cur) =>
                              cur === lesson.id ? null : lesson.id,
                            )
                          }
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

                        {isExpanded && (
                          <div className="border-t px-4 py-3 space-y-3">
                            {lesson.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {lesson.description}
                              </p>
                            )}
                            <LockedLink
                              href={`/trainee/training/${programId}/${selectedCategory.id}/${lesson.id}`}
                              isLocked={isLocked}
                              lockReason={lesson.lock_reason}
                              className="inline-flex"
                            >
                              <Button
                                size="sm"
                                variant={
                                  status === "completed" ? "outline" : "default"
                                }
                                disabled={isLocked}
                                tabIndex={isLocked ? -1 : undefined}
                                asChild={!isLocked}
                              >
                                {isLocked ? (
                                  <span>Locked</span>
                                ) : (
                                  <Link
                                    href={`/trainee/training/${programId}/${selectedCategory.id}/${lesson.id}`}
                                  >
                                    {status === "completed"
                                      ? "Review lesson"
                                      : status === "ongoing"
                                        ? "Resume lesson"
                                        : "Start lesson"}
                                  </Link>
                                )}
                              </Button>
                            </LockedLink>
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
