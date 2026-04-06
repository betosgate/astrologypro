import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ programId: string; categoryId: string }>;
}) {
  const { categoryId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_categories")
    .select("name")
    .eq("id", categoryId)
    .single();
  return {
    title: data
      ? `${data.name} - Training - AstrologyPro`
      : "Training - AstrologyPro",
  };
}

export default async function CategoryLessonsPage({
  params,
}: {
  params: Promise<{ programId: string; categoryId: string }>;
}) {
  const { programId, categoryId } = await params;

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

  // Fetch category + program name for breadcrumb
  const { data: category } = await supabase
    .from("training_categories")
    .select("id, name, description, training_id")
    .eq("id", categoryId)
    .eq("is_active", true)
    .single();

  if (!category || category.training_id !== programId) notFound();

  // Fetch program name
  const { data: program } = await supabase
    .from("training_programs")
    .select("id, name")
    .eq("id", programId)
    .single();

  // Fetch lessons ordered by priority
  const { data: lessons } = await supabase
    .from("training_lessons")
    .select(
      "id, title, description, duration_mins, priority, previous_lesson_id"
    )
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  const lessonList = lessons ?? [];
  const lessonIds = lessonList.map((l) => l.id);

  // Fetch progress
  const { data: progressRows } =
    lessonIds.length > 0
      ? await supabase
          .from("lesson_completions")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in("lesson_id", lessonIds)
      : { data: [] };

  // Fallback to trainee_lesson_progress for backward compat
  const { data: legacyProgressRows } =
    lessonIds.length > 0
      ? await supabase
          .from("trainee_lesson_progress")
          .select("lesson_id")
          .eq("trainee_id", trainee.id)
          .not("completed_at", "is", null)
          .in("lesson_id", lessonIds)
      : { data: [] };

  const completedSet = new Set([
    ...(progressRows ?? []).map((r) => r.lesson_id),
    ...(legacyProgressRows ?? []).map((r) => r.lesson_id),
  ]);

  const total = lessonList.length;
  const completed = lessonList.filter((l) => completedSet.has(l.id)).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  function isLocked(lesson: (typeof lessonList)[0]): boolean {
    if (!lesson.previous_lesson_id) return false;
    return !completedSet.has(lesson.previous_lesson_id);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link
          href="/trainee/training"
          className="hover:text-foreground transition-colors"
        >
          Training
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link
          href={`/trainee/training/${programId}`}
          className="hover:text-foreground transition-colors truncate max-w-[120px]"
        >
          {program?.name ?? "Program"}
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate">
          {category.name}
        </span>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-1 text-muted-foreground">{category.description}</p>
            )}
          </div>
          {completed === total && total > 0 && (
            <Badge className="shrink-0 bg-green-500/15 text-green-600 border-green-500/30">
              <CheckCircle2 className="size-3.5 mr-1" />
              Complete
            </Badge>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {completed}/{total} {total === 1 ? "lesson" : "lessons"} complete
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </div>

      {/* Lessons */}
      {lessonList.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No lessons have been added to this category yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessonList.map((lesson, idx) => {
            const isDone = completedSet.has(lesson.id);
            const locked = isLocked(lesson);

            return (
              <div key={lesson.id}>
                {locked ? (
                  <div className="rounded-xl border bg-card/50 opacity-60 p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="size-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground/60 mr-2 tabular-nums text-xs">
                            {String(idx + 1).padStart(2, "0")}.
                          </span>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Complete the previous lesson to unlock
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Locked
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/trainee/training/${programId}/${categoryId}/${lesson.id}`}
                    className="group block"
                  >
                    <div
                      className={[
                        "rounded-xl border bg-card p-4 transition-colors hover:border-primary/40",
                        isDone ? "border-green-500/20 bg-green-500/[0.02]" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="size-5 text-green-500" />
                          ) : (
                            <Circle className="size-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              <span className="text-muted-foreground/60 mr-2 tabular-nums text-xs">
                                {String(idx + 1).padStart(2, "0")}.
                              </span>
                              {lesson.title}
                            </p>
                            {isDone && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-xs bg-green-500/5 text-green-600 border-green-500/30"
                              >
                                Done
                              </Badge>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                          {lesson.duration_mins != null && (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              <span>{lesson.duration_mins} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/trainee/training/${programId}`}>
          <ArrowLeft className="size-4 mr-1" />
          Back to {program?.name ?? "Program"}
        </Link>
      </Button>
    </div>
  );
}
