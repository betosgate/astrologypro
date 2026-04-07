import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PlayCircle, FileText, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ categoryId: string }>;
}

export default async function TrainingCategoryPage({ params }: Props) {
  const { categoryId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");
  if (member.membership_type !== "mystery_school") redirect("/community/upgrade");

  const admin = createAdminClient();

  const [catRes, lessonsRes] = await Promise.all([
    admin
      .from("training_categories")
      .select("id, name, description")
      .eq("id", categoryId)
      .eq("is_active", true)
      .single(),
    admin
      .from("training_lessons")
      .select("id, title, description, video_url, duration_mins, priority, is_active")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("priority", { ascending: true }),
  ]);

  if (!catRes.data) notFound();

  const category = catRes.data;
  const lessons = lessonsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/mystery-school/training"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back to Training
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No lessons published in this module yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} className="transition-colors hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{lesson.title}</CardTitle>
                      {lesson.description && (
                        <CardDescription className="text-sm">{lesson.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {lesson.video_url && (
                      <PlayCircle className="size-4 text-primary" />
                    )}
                    {lesson.duration_mins != null && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Clock className="size-3" />
                        {lesson.duration_mins} min
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" asChild>
                  <Link href={`/mystery-school/training/${categoryId}/${lesson.id}`}>
                    View Lesson
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
