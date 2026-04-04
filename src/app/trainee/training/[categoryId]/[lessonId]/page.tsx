import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Clock } from "lucide-react";
import Link from "next/link";
import LessonQuiz from "@/components/trainee/lesson-quiz";
import MarkCompleteButton from "@/components/trainee/mark-complete-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string; lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_lessons")
    .select("title")
    .eq("id", lessonId)
    .single();
  return { title: data ? `${data.title} - AstrologyPro` : "Lesson - AstrologyPro" };
}

function getVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  } catch {
    return null;
  }
}

function isHtml5Video(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ categoryId: string; lessonId: string }>;
}) {
  const { categoryId, lessonId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const { data: lesson } = await supabase
    .from("training_lessons")
    .select("id, title, description, video_url, pdf_url, content, duration_mins, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (!lesson || lesson.category_id !== categoryId) notFound();

  // Check completion
  const { data: progress } = await supabase
    .from("trainee_lesson_progress")
    .select("completed_at, quiz_score, quiz_passed")
    .eq("trainee_id", trainee.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const isCompleted = !!progress?.completed_at;

  // Fetch quiz if exists
  const { data: quiz } = await supabase
    .from("training_quizzes")
    .select("id, title, questions, pass_score")
    .eq("lesson_id", lessonId)
    .eq("is_active", true)
    .maybeSingle();

  const embedUrl = lesson.video_url ? getVideoEmbed(lesson.video_url) : null;
  const isDirectVideo = lesson.video_url ? isHtml5Video(lesson.video_url) : false;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/trainee/training/${categoryId}`}>
          <ArrowLeft className="size-4 mr-1" />
          Back to Lessons
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight flex-1">{lesson.title}</h1>
          {isCompleted && (
            <Badge variant="default" className="shrink-0">
              Completed
            </Badge>
          )}
        </div>
        {lesson.duration_mins && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>{lesson.duration_mins} min</span>
          </div>
        )}
        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}
      </div>

      {/* Video */}
      {lesson.video_url && (
        <div className="overflow-hidden rounded-lg border bg-black">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : isDirectVideo ? (
            <video
              src={lesson.video_url}
              controls
              className="w-full max-h-[480px]"
            />
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Open video
              </a>
            </div>
          )}
        </div>
      )}

      {/* Lesson content */}
      {lesson.content && (
        <div className="prose prose-sm max-w-none dark:prose-invert rounded-lg border p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.content}</p>
        </div>
      )}

      {/* PDF download */}
      {lesson.pdf_url && (
        <a
          href={lesson.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <Button variant="outline" size="sm">
            <Download className="size-4 mr-2" />
            Download PDF
          </Button>
        </a>
      )}

      {/* Quiz */}
      {quiz && (
        <LessonQuiz
          questions={quiz.questions}
          passScore={quiz.pass_score}
          lessonId={lessonId}
          alreadyPassed={!!progress?.quiz_passed}
        />
      )}

      {/* Mark as complete — only if no quiz (quiz completion handles it) or already done */}
      {!quiz && (
        <MarkCompleteButton
          lessonId={lessonId}
          alreadyCompleted={isCompleted}
        />
      )}
    </div>
  );
}
