import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  LessonViewerClient,
  type LessonViewerProps,
  type SidebarLesson,
} from "@/components/trainee/lesson-viewer-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    programId: string;
    categoryId: string;
    lessonId: string;
  }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_lessons")
    .select("title")
    .eq("id", lessonId)
    .single();
  return {
    title: data ? `${data.title} - AstrologyPro` : "Lesson - AstrologyPro",
  };
}

// ---------------------------------------------------------------------------
// Fetch lesson detail via our trainee API (correct_answer never exposed)
// ---------------------------------------------------------------------------
async function fetchLessonDetail(lessonId: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(
    `${base}/api/trainee/training/lessons/${lessonId}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  return json.lesson ?? null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{
    programId: string;
    categoryId: string;
    lessonId: string;
  }>;
}) {
  const { programId, categoryId, lessonId } = await params;

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

  // Validate lesson belongs to the correct category
  const lessonData = await fetchLessonDetail(lessonId);

  if (!lessonData || lessonData.category_id !== categoryId) notFound();

  // Fetch program + category names for breadcrumb
  const [programRes, categoryRes] = await Promise.all([
    supabase
      .from("training_programs")
      .select("id, name")
      .eq("id", programId)
      .single(),
    supabase
      .from("training_categories")
      .select("id, name")
      .eq("id", categoryId)
      .single(),
  ]);

  const program = programRes.data;
  const category = categoryRes.data;

  // Fetch all lessons in the category for sidebar nav
  const { data: allCatLessons } = await supabase
    .from("training_lessons")
    .select("id, title, priority, previous_lesson_id")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  const catLessonList = allCatLessons ?? [];
  const catLessonIds = catLessonList.map((l) => l.id);

  // Fetch completion, legacy completion, category sequential flag, global lock,
  // next-lesson from cache, and program progress (for next-category routing) -- all in parallel
  const [
    completionRowsResult,
    legacyRowsResult,
    catSeqResult,
    globalLockResult,
    catProgressResult,
    programProgressResult,
  ] = await Promise.all([
    catLessonIds.length > 0
      ? supabase
          .from("lesson_completions")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in("lesson_id", catLessonIds)
      : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    catLessonIds.length > 0
      ? supabase
          .from("trainee_lesson_progress")
          .select("lesson_id")
          .eq("trainee_id", trainee.id)
          .not("completed_at", "is", null)
          .in("lesson_id", catLessonIds)
      : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    supabase
      .from("training_categories")
      .select("is_sequential")
      .eq("id", categoryId)
      .single(),
    supabase
      .from("training_settings")
      .select("global_sequential_lock")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_category_progress")
      .select("next_lesson_id")
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .maybeSingle(),
    // Program progress cache — used to find the next unlocked category
    supabase
      .from("user_program_progress")
      .select("next_category_id, next_category_name")
      .eq("user_id", user.id)
      .eq("program_id", programId)
      .maybeSingle(),
  ]);

  const completedSet = new Set([
    ...(completionRowsResult.data ?? []).map((r) => r.lesson_id),
    ...(legacyRowsResult.data ?? []).map((r) => r.lesson_id),
  ]);

  const sidebarGlobalLock = globalLockResult.data?.global_sequential_lock ?? false;
  const catIsSequential = catSeqResult.data?.is_sequential ?? false;
  const nextLessonId = catProgressResult.data?.next_lesson_id ?? null;

  function isSidebarLessonLocked(lesson: (typeof catLessonList)[0]): boolean {
    if (!sidebarGlobalLock) return false;
    if (completedSet.has(lesson.id)) return false;
    if (!catIsSequential) return false;
    if (lesson.id === (nextLessonId ?? lesson.id)) return false;
    return catLessonList.some(
      (prev) => prev.priority < lesson.priority && !completedSet.has(prev.id)
    );
  }

  const sidebarLessons: SidebarLesson[] = catLessonList.map((l) => ({
    id: l.id,
    title: l.title,
    completed: completedSet.has(l.id),
    current: l.id === lessonId,
    locked: isSidebarLessonLocked(l),
  }));

  // ── Next-item routing (consistent with sidebar lock logic) ──────────────────
  // Priority: next incomplete lesson in same category → next unlocked category → graduation
  const nextLessonFromCache = catProgressResult.data?.next_lesson_id ?? null;
  const nextCategoryId = programProgressResult.data?.next_category_id ?? null;
  const nextCategoryName = programProgressResult.data?.next_category_name ?? null;

  // Find the next lesson to go to: it should be after the current lesson by priority,
  // not completed, and not locked.
  const currentLesson = catLessonList.find((l) => l.id === lessonId);
  const currentPriority = currentLesson?.priority ?? -1;

  // Prefer the cache's next_lesson_id when it points forward from the current lesson
  let nextLessonTarget: { id: string; title: string } | null = null;
  if (nextLessonFromCache) {
    const cached = catLessonList.find((l) => l.id === nextLessonFromCache);
    if (cached && !completedSet.has(cached.id) && !isSidebarLessonLocked(cached)) {
      nextLessonTarget = { id: cached.id, title: cached.title };
    }
  }
  // Fallback: find the next incomplete, unlocked lesson after the current one by priority
  if (!nextLessonTarget) {
    const candidate = catLessonList.find(
      (l) =>
        l.priority > currentPriority &&
        !completedSet.has(l.id) &&
        !isSidebarLessonLocked(l)
    );
    if (candidate) {
      nextLessonTarget = { id: candidate.id, title: candidate.title };
    }
  }

  let nextRoute: string | null = null;
  let nextLabel: string | null = null;

  if (nextLessonTarget) {
    // Next lesson in the same category
    nextRoute = `/trainee/training/${programId}/${categoryId}/${nextLessonTarget.id}`;
    nextLabel = nextLessonTarget.title;
  } else if (nextCategoryId) {
    // No more lessons in this category → go to next unlocked category
    nextRoute = `/trainee/training/${programId}/${nextCategoryId}`;
    nextLabel = nextCategoryName ?? "Next Module";
  } else {
    // No more categories → program complete, go to graduation
    nextRoute = "/trainee/training/graduation";
    nextLabel = "View Certificate";
  }

  // Build quiz questions (correct_answer NOT included — kept server-side by API)
  // Normalize options: DB may store string[] or { text: string }[]
  const quizQuestions = (lessonData.quiz_questions ?? []).map(
    (q: {
      id: string;
      question: string;
      options: unknown;
      explanation?: string | null;
    }) => ({
      id: q.id,
      question: q.question,
      options: Array.isArray(q.options)
        ? q.options.map((opt: unknown) =>
            typeof opt === "string" ? { text: opt } : (opt as { text: string })
          )
        : [],
      explanation: q.explanation ?? null,
    })
  );

  const viewerProps: LessonViewerProps = {
    lessonId,
    programId,
    categoryId,
    title: lessonData.title,
    description: lessonData.description ?? null,
    content: lessonData.content ?? null,
    videoUrl: lessonData.video_url ?? null,
    pdfUrl: lessonData.pdf_url ?? null,
    durationMins: lessonData.duration_mins ?? null,
    videos: lessonData.videos ?? [],
    assets: lessonData.assets ?? [],
    quizQuestions,
    quizPassed: lessonData.quiz_passed === true,
    quizLastScore: lessonData.quiz_last_score ?? null,
    quizLastTotal: lessonData.quiz_last_total ?? null,
    isCompleted: lessonData.completed === true,
    nextRoute,
    nextLabel,
    sidebarLessons,
    triggers: lessonData.triggers ?? [],
    lastPositionSeconds: lessonData.last_position_seconds ?? 0,
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link
          href="/trainee/training"
          className="hover:text-foreground transition-colors"
        >
          Training
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        {program && (
          <>
            <Link
              href={`/trainee/training/${programId}`}
              className="hover:text-foreground transition-colors truncate max-w-[100px]"
            >
              {program.name}
            </Link>
            <ChevronRight className="size-3.5 shrink-0" />
          </>
        )}
        {category && (
          <>
            <Link
              href={`/trainee/training/${programId}/${categoryId}`}
              className="hover:text-foreground transition-colors truncate max-w-[100px]"
            >
              {category.name}
            </Link>
            <ChevronRight className="size-3.5 shrink-0" />
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-[140px]">
          {lessonData.title}
        </span>
      </div>

      {/* Client-side interactive viewer */}
      <LessonViewerClient {...viewerProps} />

      {/* Bottom back navigation */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/trainee/training/${programId}/${categoryId}`}>
          <ArrowLeft className="size-4 mr-1" />
          Back to {category?.name ?? "Lessons"}
        </Link>
      </Button>
    </div>
  );
}
