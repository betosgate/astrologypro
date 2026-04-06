import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  Lock,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_programs")
    .select("name")
    .eq("id", programId)
    .single();
  return {
    title: data ? `${data.name} - Training - AstrologyPro` : "Training - AstrologyPro",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LessonSummary = {
  id: string;
  title: string;
  priority: number;
  completed: boolean;
  quiz_passed: boolean | null;
  previous_lesson_id: string | null;
};

type CategoryWithProgress = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  completed: boolean;
  progress: { completed: number; total: number };
  lessons: LessonSummary[];
};

type ProgramDetail = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  progress: number;
  categories: CategoryWithProgress[];
};

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------
async function fetchProgramDetail(programId: string): Promise<ProgramDetail | null> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${base}/api/trainee/training/programs`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = await res.json();
  const programs: ProgramDetail[] = json.programs ?? [];
  return programs.find((p) => p.id === programId) ?? null;
}

// ---------------------------------------------------------------------------
// Lesson row inside expanded category
// ---------------------------------------------------------------------------
function LessonRow({
  lesson,
  index,
  programId,
  categoryId,
  isLocked,
}: {
  lesson: LessonSummary;
  index: number;
  programId: string;
  categoryId: string;
  isLocked: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
        isLocked
          ? "opacity-50 cursor-not-allowed"
          : lesson.completed
          ? "text-muted-foreground hover:bg-muted/40"
          : "hover:bg-muted/40",
      ].join(" ")}
    >
      {/* Status icon */}
      <div className="shrink-0 w-5 flex justify-center">
        {lesson.completed ? (
          <CheckCircle2 className="size-4 text-green-500" />
        ) : isLocked ? (
          <Lock className="size-3.5 text-muted-foreground/50" />
        ) : (
          <div className="size-4 rounded-full border-2 border-muted-foreground/40" />
        )}
      </div>

      {/* Lesson number + title */}
      <span className="flex-1 min-w-0 truncate">
        <span className="text-muted-foreground/60 mr-1.5 tabular-nums">
          {String(index + 1).padStart(2, "0")}.
        </span>
        {isLocked ? (
          <span>{lesson.title}</span>
        ) : (
          <Link
            href={`/trainee/training/${programId}/${categoryId}/${lesson.id}`}
            className="hover:text-primary hover:underline underline-offset-2 transition-colors"
          >
            {lesson.title}
          </Link>
        )}
      </span>

      {/* Quiz badge */}
      {lesson.quiz_passed === true && (
        <Badge
          variant="outline"
          className="shrink-0 text-xs bg-green-500/5 text-green-600 border-green-500/30"
        >
          Quiz Passed
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category card (server — no expand/collapse for simplicity; always expanded)
// ---------------------------------------------------------------------------
function CategoryCard({
  category,
  index,
  programId,
  allCategories,
}: {
  category: CategoryWithProgress;
  index: number;
  programId: string;
  allCategories: CategoryWithProgress[];
}) {
  const { completed, total } = category.progress;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Status
  const isDone = category.completed || (total > 0 && completed === total);
  const isPrev = index > 0 && !allCategories[index - 1].completed;
  // A category is locked if ANY previous category is not complete
  const isLocked = allCategories
    .slice(0, index)
    .some((c) => !c.completed && c.progress.total > 0);

  const statusLabel = isDone ? "Done" : isLocked ? "Locked" : completed > 0 ? "In Progress" : "Not Started";
  const statusClasses = isDone
    ? "bg-green-500/10 text-green-600 border-green-500/30"
    : isLocked
    ? "bg-muted text-muted-foreground border-border"
    : completed > 0
    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";

  // For each lesson, determine if it's locked based on previous_lesson_id
  const completedSet = new Set(
    category.lessons.filter((l) => l.completed).map((l) => l.id)
  );

  function isLessonLocked(lesson: LessonSummary): boolean {
    if (isLocked) return true;
    if (!lesson.previous_lesson_id) return false;
    return !completedSet.has(lesson.previous_lesson_id);
  }

  return (
    <div
      className={[
        "rounded-xl border overflow-hidden transition-colors",
        isLocked ? "opacity-70" : "hover:border-primary/30",
      ].join(" ")}
    >
      {/* Category header */}
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground mt-0.5">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{category.name}</h3>
              {isLocked && <Lock className="size-3.5 text-muted-foreground/60" />}
            </div>
            <Badge
              variant="outline"
              className={["text-xs shrink-0", statusClasses].join(" ")}
            >
              {isDone && <CheckCircle2 className="size-3 mr-1" />}
              {statusLabel}
            </Badge>
          </div>
          {category.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {total} {total === 1 ? "lesson" : "lessons"}
            </span>
            <span>{completed}/{total} complete</span>
          </div>
          <Progress value={pct} className="mt-2 h-1" />
        </div>
      </div>

      {/* Lessons list */}
      {category.lessons.length > 0 && (
        <div className="border-t bg-muted/10 px-2 py-2 space-y-0.5">
          {category.lessons.map((lesson, li) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={li}
              programId={programId}
              categoryId={category.id}
              isLocked={isLessonLocked(lesson)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!trainee) redirect("/join/trainee");

  const program = await fetchProgramDetail(programId);
  if (!program) notFound();

  const totalLessons = program.categories.reduce(
    (s, c) => s + c.progress.total,
    0
  );
  const completedLessons = program.categories.reduce(
    (s, c) => s + c.progress.completed,
    0
  );
  const completedCats = program.categories.filter((c) => c.completed).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/trainee/training"
          className="hover:text-foreground transition-colors"
        >
          Training
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate">{program.name}</span>
      </div>

      {/* Header + sticky progress sidebar (desktop: grid layout) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
            {program.description && (
              <p className="mt-2 text-muted-foreground">{program.description}</p>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {program.categories.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No categories in this program yet.
                </CardContent>
              </Card>
            ) : (
              program.categories.map((cat, idx) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  index={idx}
                  programId={programId}
                  allCategories={program.categories}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar: sticky progress */}
        <aside className="w-full lg:w-64 lg:sticky lg:top-24 shrink-0">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Your Progress</h2>
            <div className="flex flex-col items-center gap-3">
              <CircularProgress
                percentage={program.progress}
                size={96}
                strokeWidth={8}
              />
              <p className="text-sm text-muted-foreground text-center">
                {completedLessons} of {totalLessons} lessons complete
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-medium tabular-nums">
                  {completedCats}/{program.categories.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lessons</span>
                <span className="font-medium tabular-nums">
                  {completedLessons}/{totalLessons}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full"
            >
              <Link href="/trainee/training">
                <ArrowLeft className="size-3.5 mr-1.5" />
                All Programs
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
