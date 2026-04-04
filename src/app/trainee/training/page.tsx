import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Training School - AstrologyPro" };

export default async function TrainingCategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  // Fetch all active categories ordered by priority
  const { data: categories } = await supabase
    .from("training_categories")
    .select("id, name, description, priority")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training School</h1>
          <p className="text-muted-foreground">Study materials and lessons for your certification.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No training categories yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Training modules will appear here once your administrator adds content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch lesson counts per category
  const categoryIds = categories.map((c) => c.id);

  const { data: allLessons } = await supabase
    .from("training_lessons")
    .select("id, category_id")
    .in("category_id", categoryIds)
    .eq("is_active", true);

  // Fetch progress records for this trainee
  const lessonIds = (allLessons ?? []).map((l) => l.id);
  const { data: progressRows } = lessonIds.length > 0
    ? await supabase
        .from("trainee_lesson_progress")
        .select("lesson_id")
        .eq("trainee_id", trainee.id)
        .not("completed_at", "is", null)
        .in("lesson_id", lessonIds)
    : { data: [] };

  const completedSet = new Set((progressRows ?? []).map((p) => p.lesson_id));

  // Build per-category stats
  const categoryStats = categories.map((cat) => {
    const total = (allLessons ?? []).filter((l) => l.category_id === cat.id).length;
    const completed = (allLessons ?? []).filter(
      (l) => l.category_id === cat.id && completedSet.has(l.id)
    ).length;
    return { ...cat, total, completed };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training School</h1>
        <p className="text-muted-foreground">Study materials and lessons for your certification.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categoryStats.map((cat) => {
          const progressPct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
          const isComplete = cat.total > 0 && cat.completed === cat.total;

          return (
            <Link key={cat.id} href={`/trainee/training/${cat.id}`} className="group block">
              <Card className="h-full transition-colors hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                      {cat.name}
                    </CardTitle>
                    {isComplete && (
                      <Badge variant="default" className="shrink-0">
                        Complete
                      </Badge>
                    )}
                  </div>
                  {cat.description && (
                    <CardDescription className="text-sm">{cat.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{cat.total} {cat.total === 1 ? "lesson" : "lessons"}</span>
                    <span>{cat.completed}/{cat.total} completed</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
