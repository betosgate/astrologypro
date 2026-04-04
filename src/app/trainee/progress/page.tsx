import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen, Award, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Progress - AstrologyPro" };

export default async function TraineeProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, specialties, training_status, created_at, graduated_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  // Fetch all active categories + lessons
  const { data: categories } = await supabase
    .from("training_categories")
    .select("id, name, description, priority")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  const { data: allLessons } = await supabase
    .from("training_lessons")
    .select("id, title, category_id")
    .eq("is_active", true);

  // Fetch this trainee's progress
  const lessonIds = (allLessons ?? []).map((l) => l.id);
  const { data: progressRows } =
    lessonIds.length > 0
      ? await supabase
          .from("trainee_lesson_progress")
          .select("lesson_id, completed_at, quiz_score, quiz_passed")
          .eq("trainee_id", trainee.id)
          .in("lesson_id", lessonIds)
      : { data: [] };

  const progressMap = new Map(
    (progressRows ?? []).map((p) => [p.lesson_id, p])
  );

  const totalLessons = (allLessons ?? []).length;
  const completedLessons = (progressRows ?? []).filter(
    (p) => p.completed_at
  ).length;
  const overallPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isGraduated = !!trainee.graduated_at;

  const categoryStats = (categories ?? []).map((cat) => {
    const lessons = (allLessons ?? []).filter((l) => l.category_id === cat.id);
    const completed = lessons.filter((l) => progressMap.get(l.id)?.completed_at).length;
    return { ...cat, lessons, total: lessons.length, completed };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
          <p className="text-muted-foreground">
            Track your training completion and quiz scores.
          </p>
        </div>
        {isGraduated && (
          <Button asChild>
            <Link href="/trainee/certificate">
              <Award className="mr-2 size-4" />
              View Certificate
            </Link>
          </Button>
        )}
      </div>

      {/* Overall summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              Lessons Completed
            </CardDescription>
            <CardTitle className="text-3xl">
              {completedLessons}
              <span className="text-lg text-muted-foreground font-normal">
                /{totalLessons}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallPct} className="h-2" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {overallPct}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              Training Status
            </CardDescription>
            <CardTitle className="text-lg mt-1">
              <Badge
                variant={isGraduated ? "default" : "secondary"}
                className="text-sm"
              >
                {isGraduated
                  ? "Graduated"
                  : trainee.training_status ?? "active"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Started{" "}
              {new Date(trainee.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            {isGraduated && (
              <p className="text-xs text-primary font-medium mt-0.5">
                Graduated{" "}
                {new Date(trainee.graduated_at!).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Avg Quiz Score
            </CardDescription>
            <CardTitle className="text-3xl">
              {(() => {
                const scored = (progressRows ?? []).filter(
                  (p) => p.quiz_score !== null
                );
                if (scored.length === 0) return "—";
                const avg = Math.round(
                  scored.reduce((s, p) => s + (p.quiz_score ?? 0), 0) /
                    scored.length
                );
                return `${avg}%`;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across{" "}
              {(progressRows ?? []).filter((p) => p.quiz_score !== null).length}{" "}
              quizzes taken
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graduation banner */}
      {isGraduated && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Award className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">
                Congratulations, {trainee.name?.split(" ")[0] ?? "Trainee"}!
              </p>
              <p className="text-sm text-muted-foreground">
                You have completed the full training program.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/trainee/certificate">View Certificate</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Per-category breakdown */}
      {categoryStats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Module Breakdown</h2>
          {categoryStats.map((cat) => {
            const pct =
              cat.total > 0
                ? Math.round((cat.completed / cat.total) * 100)
                : 0;
            const catComplete = cat.total > 0 && cat.completed === cat.total;

            return (
              <Card key={cat.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                    {catComplete ? (
                      <Badge variant="default">Complete</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {cat.completed}/{cat.total}
                      </span>
                    )}
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {cat.lessons.map((lesson) => {
                      const p = progressMap.get(lesson.id);
                      const done = !!p?.completed_at;
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {done ? (
                              <CheckCircle2 className="size-4 shrink-0 text-primary" />
                            ) : (
                              <div className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                            )}
                            <Link
                              href={`/trainee/training/${cat.id}/${lesson.id}`}
                              className="truncate hover:text-primary transition-colors"
                            >
                              {lesson.title}
                            </Link>
                          </div>
                          {p?.quiz_score !== null && p?.quiz_score !== undefined && (
                            <Badge
                              variant={p.quiz_passed ? "default" : "secondary"}
                              className="shrink-0 text-xs"
                            >
                              {p.quiz_score}%
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalLessons === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No training modules available yet. Check back soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
