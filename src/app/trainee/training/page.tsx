import { Suspense } from "react";
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

  const { createClient: makeClient } = await import("@/lib/supabase/server");
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
  return json.programs ?? [];
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function ProgramCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="size-20 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Program Card
// ---------------------------------------------------------------------------
function ProgramCard({ program }: { program: Program }) {
  const totalLessons = program.total_lessons;
  const completedLessons = program.completed_lessons;
  const completedCategories = program.completed_categories;

  // Find the current in-progress category (first not fully done)
  const currentCategory = program.categories.find(
    (c) => !c.completed && c.total_lessons > 0
  );

  const isComplete = program.progress_pct >= 100 && totalLessons > 0;
  const isStarted = completedLessons > 0;

  const ctaHref = currentCategory
    ? `/trainee/training/${program.id}/${currentCategory.id}`
    : `/trainee/training/${program.id}`;

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

  // Overall summary stats
  const totalLessons = programs.reduce(
    (s, p) => s + p.total_lessons,
    0
  );
  const completedLessons = programs.reduce(
    (s, p) => s + p.completed_lessons,
    0
  );
  const completedCategories = programs.reduce(
    (s, p) => s + p.completed_categories,
    0
  );
  const overallPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

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
        {totalLessons > 0 && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground tabular-nums">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <Progress value={overallPct} className="h-2" />
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

      {/* Summary strip */}
      {completedLessons > 0 && (
        <div className="rounded-xl border bg-card px-5 py-4">
          <h2 className="text-sm font-semibold mb-3">Your Progress Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {completedLessons}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lessons Done
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {completedCategories}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Categories Done
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {overallPct}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overall
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
