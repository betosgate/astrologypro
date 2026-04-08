import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ categoryId: string; lessonId: string }>;
}

export default async function TrainingLessonPage({ params }: Props) {
  const { categoryId, lessonId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await requireMysterySchoolAccess();
  if (!result) redirect("/mystery-school/enroll");

  const admin = createAdminClient();

  const [catRes, lessonRes] = await Promise.all([
    admin
      .from("training_categories")
      .select("id, name")
      .eq("id", categoryId)
      .single(),
    admin
      .from("training_lessons")
      .select("id, category_id, title, description, video_url, content, pdf_url, duration_mins, is_active")
      .eq("id", lessonId)
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .single(),
  ]);

  if (!lessonRes.data) notFound();

  const lesson = lessonRes.data;
  const category = catRes.data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="space-y-1">
        <Link
          href={`/mystery-school/training/${categoryId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {category?.name ?? "Back to Module"}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}
        {lesson.duration_mins != null && (
          <Badge variant="secondary" className="flex w-fit items-center gap-1 text-xs">
            <Clock className="size-3" />
            {lesson.duration_mins} min
          </Badge>
        )}
      </div>

      {/* Video embed */}
      {lesson.video_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
              <iframe
                src={lesson.video_url}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lesson content */}
      {lesson.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lesson Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.content}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF download */}
      {lesson.pdf_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> Supplemental Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">
                Download PDF
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="pt-2">
        <Button variant="outline" asChild>
          <Link href={`/mystery-school/training/${categoryId}`}>
            <ChevronLeft className="mr-1 size-4" /> Back to Module
          </Link>
        </Button>
      </div>
    </div>
  );
}
