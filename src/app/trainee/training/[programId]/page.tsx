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
  is_locked: boolean;
  lock_reason: string | null;
};

type CategoryWithProgress = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  completed: boolean;
  is_locked: boolean;
  lock_reason: string | null;
  is_sequential: boolean;
  // API returns flat fields — progress_pct / completed_lessons / total_lessons
  progress_pct: number;
  completed_lessons: number;
  total_lessons: number;
  next_lesson_id: string | null;
  next_lesson_title: string | null;
  lessons: LessonSummary[];
};

type ProgramDetail = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  is_sequential: boolean;
  progress_pct: number;
  completed_lessons: number;
  total_lessons: number;
  completed_categories: number;
  total_categories: number;
  next_category_id: string | null;
  next_category_name: string | null;
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
// Category card (server — always expanded)
// ---------------------------------------------------------------------------
function CategoryCard({
  category,
  index,
  programId,
  nextCategoryId,
}: {
  category: CategoryWithProgress;
  index: number;
  programId: string;
  nextCategoryId: string | null;
}) {
  const completed = category.completed_lessons;
  const total = category.total_lessons;
  const pct = category.progress_pct;

  // Use API-sourced lock flag — computed server-side from is_sequential + priorities
  const isLocked = category.is_locked;
  const isDone = category.completed || (total > 0 && completed === total);
  // "Resume" badge: the category is not done, not locked, and is the next one
  const isResume =
    !isDone &&
    !isLocked &&
    nextCategoryId !== null &&
    category.id === nextCategoryId;

  const statusLabel = isDone
    ? "Done"
    : isLocked
    ? "Locked"
    : isResume
    ? "Resume"
    : completed > 0
    ? "In Progress"
    : "Not Started";

  const statusClasses = isDone
    ? "bg-green-500/10 text-green-600 border-green-500/30"
    : isLocked
    ? "bg-muted text-muted-foreground border-border"
    : isResume
    ? "bg-primary/5 text-primary border-primary/30"
    : completed > 0
    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";

  return (
    <div
      className={[
        "rounded-xl border overflow-hidden transition-colors",
        isLocked ? "opacity-70" : "hover:border-primary/30",
      ].join(" ")}
      title={isLocked ? (category.lock_reason ?? undefined) : undefined}
    >
      {/* Category header */}
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground mt-0.5">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                  <Lock className="size-3.5 text-muted-foreground/60" />
                </>
              ) : (
                <Link
                  href={`/trainee/training/${programId}/${category.id}`}
                  className="font-semibold text-sm hover:text-primary hover:underline underline-offset-2 transition-colors"
                >
                  {category.name}
                </Link>
              )}
            </div>
            <Badge
              variant="outline"
              className={["text-xs shrink-0", statusClasses].join(" ")}
            >
              {isDone && <CheckCircle2 className="size-3 mr-1" />}
              {isLocked && <Lock className="size-3 mr-1" />}
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
            <span>
              {completed}/{total} complete
            </span>
          </div>
          <Progress value={pct} className="mt-2 h-1" />
        </div>
      </div>

      {/* Lessons list — use API is_locked field per lesson */}
      {category.lessons.length > 0 && (
        <div className="border-t bg-muted/10 px-2 py-2 space-y-0.5">
          {category.lessons.map((lesson, li) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={li}
              programId={programId}
              categoryId={category.id}
              isLocked={isLocked || lesson.is_locked}
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

  const totalLessons = program.total_lessons;
  const completedLessons = program.completed_lessons;
  const completedCats = program.completed_categories;

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
                  nextCategoryId={program.next_category_id}
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
                percentage={program.progress_pct}
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
                  {completedCats}/{program.total_categories}
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
