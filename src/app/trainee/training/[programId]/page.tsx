import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ProgramWorkspace } from "@/components/trainee/program-workspace";

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
  /** "Started but not completed" hint from lesson_progress — drives the
   *  Ongoing status badge in the program workspace. */
  in_progress?: boolean;
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

      {/* Program header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
          {program.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {program.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {completedCats}/{program.total_categories} categories
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {completedLessons}/{totalLessons} lessons
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{program.progress_pct}% complete</span>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/trainee/training">
            <ArrowLeft className="size-3.5 mr-1.5" />
            All programs
          </Link>
        </Button>
      </div>

      {/* Module 02: two-pane workspace.
          Initial selection rules per the task spec:
            - lowest-priority unlocked, incomplete category (in priority order)
            - that category's next_lesson_id (or first unlocked lesson). */}
      {program.categories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No categories in this program yet.
          </CardContent>
        </Card>
      ) : (
        (() => {
          // Pick the in-progress category, or fall back to the first unlocked
          // incomplete one, or the first one if everything is done.
          const initialCategory =
            program.categories.find((c) => c.id === program.next_category_id) ??
            program.categories.find(
              (c) => !c.is_locked && !c.completed && c.total_lessons > 0,
            ) ??
            program.categories[0] ??
            null;

          const initialLesson =
            initialCategory?.lessons.find(
              (l) => l.id === initialCategory.next_lesson_id && !l.is_locked,
            )?.id ??
            initialCategory?.lessons.find(
              (l) => !l.is_locked && !l.completed,
            )?.id ??
            initialCategory?.lessons.find((l) => !l.is_locked)?.id ??
            null;

          return (
            <ProgramWorkspace
              programId={programId}
              programName={program.name}
              categories={program.categories}
              initialCategoryId={initialCategory?.id ?? null}
              initialLessonId={initialLesson}
            />
          );
        })()
      )}
    </div>
  );
}
