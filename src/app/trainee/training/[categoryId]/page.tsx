import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_categories")
    .select("name")
    .eq("id", categoryId)
    .single();
  return { title: data ? `${data.name} - Training - AstrologyPro` : "Training - AstrologyPro" };
}

export default async function TrainingCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const { data: category } = await supabase
    .from("training_categories")
    .select("id, name, description")
    .eq("id", categoryId)
    .eq("is_active", true)
    .single();

  if (!category) notFound();

  const { data: lessons } = await supabase
    .from("training_lessons")
    .select("id, title, description, duration_mins, priority")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  const lessonIds = (lessons ?? []).map((l) => l.id);
  const { data: progressRows } = lessonIds.length > 0
    ? await supabase
        .from("trainee_lesson_progress")
        .select("lesson_id, completed_at, quiz_passed")
        .eq("trainee_id", trainee.id)
        .not("completed_at", "is", null)
        .in("lesson_id", lessonIds)
    : { data: [] };

  const completedSet = new Set((progressRows ?? []).map((p) => p.lesson_id));
  const total = (lessons ?? []).length;
  const completed = (lessons ?? []).filter((l) => completedSet.has(l.id)).length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/trainee/training">
          <ArrowLeft className="size-4 mr-1" />
          Back to Training
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {completed} of {total} {total === 1 ? "lesson" : "lessons"} completed
        </p>
      </div>

      {(!lessons || lessons.length === 0) ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No lessons have been added to this category yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const isDone = completedSet.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                href={`/trainee/training/${categoryId}/${lesson.id}`}
                className="group block"
              >
                <Card className="transition-colors hover:border-primary/30">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="size-5 text-primary" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            <span className="text-muted-foreground mr-2 text-sm font-normal">
                              {String(idx + 1).padStart(2, "0")}.
                            </span>
                            {lesson.title}
                          </CardTitle>
                          {isDone && (
                            <Badge variant="default" className="shrink-0 text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {lesson.duration_mins && (
                    <CardContent className="pb-3 pt-0 pl-11">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{lesson.duration_mins} min</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
