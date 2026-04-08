import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import { BookOpen, GraduationCap, CheckCircle2, LayoutGrid } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Training Center - AstrologyPro" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types (match the shape returned by GET /api/trainee/training/programs)
// ---------------------------------------------------------------------------
type ProgramCategory = {
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
  lessons: {
    id: string;
    title: string;
    priority: number;
    completed: boolean;
    quiz_passed: boolean | null;
    is_locked: boolean;
    lock_reason: string | null;
  }[];
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  progress_pct: number;
  completed_lessons: number;
  total_lessons: number;
  completed_categories: number;
  total_categories: number;
  next_category_id: string | null;
  next_category_name: string | null;
  categories: ProgramCategory[];
};

// ---------------------------------------------------------------------------
// Data fetch (server-side, co-located)
// ---------------------------------------------------------------------------
async function fetchPrograms(): Promise<Program[]> {
  // We call our own API route from the server via absolute URL.
  // Use NEXT_PUBLIC_APP_URL or fall back to localhost for SSR.
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${base}/api/trainee/training/programs`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const json = await res.json();
  if (!Array.isArray(json.programs)) return [];

  return json.programs.map((program: Partial<Program>) => ({
    id: program.id ?? "",
    name: program.name ?? "Untitled Program",
    description: program.description ?? null,
    priority: program.priority ?? 0,
    progress_pct: Number(program.progress_pct ?? 0),
    completed_lessons: Number(program.completed_lessons ?? 0),
    total_lessons: Number(program.total_lessons ?? 0),
    completed_categories: Number(program.completed_categories ?? 0),
    total_categories: Number(program.total_categories ?? 0),
    next_category_id: program.next_category_id ?? null,
    next_category_name: program.next_category_name ?? null,
    categories: Array.isArray(program.categories) ? program.categories : [],
  }));
}

// ---------------------------------------------------------------------------
// Program Card
// ---------------------------------------------------------------------------
function ProgramCard({ program }: { program: Program }) {
  const totalLessons = program.total_lessons;
  const completedLessons = program.completed_lessons;
  const completedCategories = program.completed_categories;

  // Find the current in-progress category (first not fully done)
  const currentCategory =
    program.categories.find((c) => c.id === program.next_category_id) ??
    program.categories.find((c) => !c.is_locked && !c.completed && c.total_lessons > 0) ??
    program.categories.find((c) => !c.completed && c.total_lessons > 0);

  const isComplete = program.progress_pct >= 100 && totalLessons > 0;
  const isStarted = completedLessons > 0;

  // Module 02: program CTA always opens the program workspace, never a
  // lesson deep-link. Initial selection state lives inside the workspace.
  const ctaHref = `/trainee/training/${program.id}`;

  return (
    <div className="group rounded-xl border bg-card transition-colors hover:border-primary/40 overflow-hidden">
      {/* Status strip at top */}
      {isComplete && (
        <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 text-xs font-medium text-green-600">
          <CheckCircle2 className="size-3.5 shrink-0" />
          Program Complete
        </div>
      )}
      {!isComplete && isStarted && currentCategory && (
        <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 truncate">
          <div className="size-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span className="truncate">In progress: {currentCategory.name}</span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Card body */}
        <div className="flex items-start gap-4">
          {/* Circular progress ring */}
          <CircularProgress
            percentage={program.progress_pct}
            size={72}
            strokeWidth={6}
            className="shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                {program.name}
              </h2>
              {isComplete && (
                <Badge className="shrink-0 bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">
                  Complete
                </Badge>
              )}
            </div>
            {program.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {program.description}
              </p>
            )}
            {/* Meta badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                <LayoutGrid className="size-3" />
                {program.categories.length}{" "}
                {program.categories.length === 1 ? "category" : "categories"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                <BookOpen className="size-3" />
                {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
              </span>
              {completedCategories > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/5 px-2 py-0.5 text-xs text-green-600">
                  <CheckCircle2 className="size-3" />
                  {completedCategories} done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedLessons}/{totalLessons} lessons complete
            </span>
            <span>{program.progress_pct}%</span>
          </div>
          <Progress value={program.progress_pct} className="h-1.5" />
        </div>

        {/* CTA */}
        <Button
          asChild
          size="sm"
          variant={isComplete ? "outline" : "default"}
          className="w-full"
        >
          <Link href={ctaHref}>
            {isComplete ? "Review Program" : isStarted ? "Continue" : "Start Program"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="size-7 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">No training available</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
            No training programs are available for your account. Contact your
            administrator if you believe this is an error.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function TrainingCenterPage() {
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

  const programs = await fetchPrograms();

  // ── Module 03: learner-wide accessible-lesson status split ───────────────
  // Counting rules:
  //   Completed   = lesson.completed === true (authoritative lesson_completions)
  //   Ongoing     = lesson is in lesson_progress with a started_at but no
  //                 completed_at, AND not already completed
  //   Not Started = accessible lesson with no progress and no completion
  // Total is the union of every lesson across every accessible program — locked
  // lessons in accessible programs are counted (typically as Not Started).
  const allAccessibleLessonIds: string[] = [];
  let completedLessons = 0;
  for (const program of programs) {
    for (const cat of program.categories) {
      for (const lesson of cat.lessons) {
        allAccessibleLessonIds.push(lesson.id);
        if (lesson.completed) completedLessons++;
      }
    }
  }
  const totalLessons = allAccessibleLessonIds.length;

  // Pull "started but not completed" lesson_progress rows in one query.
  let ongoingLessonIds = new Set<string>();
  if (allAccessibleLessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .not("started_at", "is", null)
      .is("completed_at", null)
      .in("lesson_id", allAccessibleLessonIds);
    ongoingLessonIds = new Set((progressRows ?? []).map((r) => r.lesson_id));
  }

  // Build a completed set for the mutually-exclusive split.
  const completedLessonIds = new Set<string>();
  for (const program of programs) {
    for (const cat of program.categories) {
      for (const lesson of cat.lessons) {
        if (lesson.completed) completedLessonIds.add(lesson.id);
      }
    }
  }

  // Status counts (mutually exclusive, collectively exhaustive).
  const completedCount = completedLessonIds.size;
  const ongoingCount = Array.from(ongoingLessonIds).filter(
    (id) => !completedLessonIds.has(id),
  ).length;
  const notStartedCount = Math.max(
    0,
    totalLessons - completedCount - ongoingCount,
  );

  const overallPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Center</h1>
          <p className="text-muted-foreground mt-1">
            Work through your training programs and earn your certification.
          </p>
        </div>

        {/* Module 03: learner-wide overall progress with explicit
            Not Started / Ongoing / Completed split. Counts cover every
            accessible lesson, not only lessons the learner has touched. */}
        {totalLessons > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* LEFT half: three status blocks */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-muted-foreground/20 bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-muted-foreground">
                    {notStartedCount}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
                    Not Started
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-amber-700">
                    {ongoingCount}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-amber-700/80 mt-0.5">
                    Ongoing
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-emerald-700">
                    {completedCount}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-emerald-700/80 mt-0.5">
                    Completed
                  </p>
                </div>
              </div>

              {/* RIGHT half: total + progress bar */}
              <div className="flex flex-col justify-between gap-3">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-2xl font-bold tabular-nums">
                    {completedCount}/{totalLessons}
                  </span>
                  <span className="text-sm text-muted-foreground">lessons</span>
                </div>
                <div className="space-y-1.5">
                  <Progress value={overallPct} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right tabular-nums">
                    {overallPct}% complete
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Programs grid */}
      {programs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}

    </div>
  );
}
