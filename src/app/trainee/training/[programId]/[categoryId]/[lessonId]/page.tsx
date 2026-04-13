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

type ProgramHierarchyLesson = {
  id: string;
  title: string;
  completed: boolean;
  is_locked: boolean;
};

type ProgramHierarchyCategory = {
  id: string;
  name: string;
  is_locked: boolean;
  next_lesson_id: string | null;
  next_lesson_title: string | null;
  lessons: ProgramHierarchyLesson[];
};

type ProgramHierarchyProgram = {
  id: string;
  next_category_id: string | null;
  next_category_name: string | null;
  categories: ProgramHierarchyCategory[];
};

function normalizeQuizOptions(options: unknown): { text: string }[] {
  if (!Array.isArray(options)) return [];

  return options.flatMap((option) => {
    if (typeof option === "string") {
      const text = option.trim();
      return text ? [{ text }] : [];
    }

    if (
      option &&
      typeof option === "object" &&
      "text" in option &&
      typeof option.text === "string"
    ) {
      const text = option.text.trim();
      return text ? [{ text }] : [];
    }

    return [];
  });
}

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
// Returns { lesson, locked } so the page can distinguish a 403 lock from a
// genuine 404, and redirect the learner to the program workspace instead of
// showing a generic not-found page.
// ---------------------------------------------------------------------------
async function fetchLessonDetail(
  lessonId: string
  // The API returns a large, loosely-typed lesson payload that the existing
  // downstream code consumes via ad-hoc property access. Keeping it typed as
  // `any` preserves the prior behavior without bringing in a full shared
  // LessonDetail interface (out of scope for the lock/redirect fix).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ lesson: any; locked: boolean }> {
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

  if (res.status === 403) return { lesson: null, locked: true };
  if (!res.ok) return { lesson: null, locked: false };
  const json = await res.json();
  return { lesson: json.lesson ?? null, locked: false };
}

async function fetchProgramHierarchy(programId: string) {
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
  const programs = Array.isArray(json.programs) ? (json.programs as ProgramHierarchyProgram[]) : [];
  return programs.find((program) => program.id === programId) ?? null;
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

  // Validate lesson belongs to the correct category.
  // A 403 from the API means the lesson is sequentially locked — redirect the
  // learner to the program workspace (which shows the lock state visually)
  // rather than surfacing a generic 404.
  const { lesson: lessonData, locked: lessonLocked } =
    await fetchLessonDetail(lessonId);

  if (lessonLocked) redirect(`/trainee/training/${programId}`);
  if (!lessonData || lessonData.category_id !== categoryId) notFound();

  // Fetch program/category names plus programs hierarchy for consistent sidebar/next metadata
  const [programRes, categoryRes, programHierarchy] = await Promise.all([
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
    fetchProgramHierarchy(programId),
  ]);

  const program = programRes.data;
  const category = categoryRes.data;

  const hierarchyCategory =
    programHierarchy?.categories.find((cat) => cat.id === categoryId) ?? null;

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

  const sidebarLessons: SidebarLesson[] = hierarchyCategory
    ? hierarchyCategory.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        completed: lesson.completed,
        current: lesson.id === lessonId,
        locked: hierarchyCategory.is_locked || lesson.is_locked,
      }))
    : catLessonList.map((l) => ({
        id: l.id,
        title: l.title,
        completed: completedSet.has(l.id),
        current: l.id === lessonId,
        locked: isSidebarLessonLocked(l),
      }));

  // ── Next-item routing (consistent with sidebar lock logic) ──────────────────
  // Priority: next incomplete lesson in same category → next unlocked category → graduation
  const nextLessonFromCache =
    hierarchyCategory?.next_lesson_id ?? catProgressResult.data?.next_lesson_id ?? null;
  const nextCategoryId =
    programHierarchy?.next_category_id ?? programProgressResult.data?.next_category_id ?? null;
  const nextCategoryName =
    programHierarchy?.next_category_name ?? programProgressResult.data?.next_category_name ?? null;

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
      remediation_video_id?: string | null;
      remediation_video_index?: number | null;
      remediation_start_seconds?: number | null;
      remediation_replay_until_seconds?: number | null;
      remediation_message?: string | null;
    }) => ({
      id: q.id,
      question: q.question,
      options: normalizeQuizOptions(q.options),
      explanation: q.explanation ?? null,
      remediation_video_id: q.remediation_video_id ?? null,
      remediation_video_index: q.remediation_video_index ?? null,
      remediation_start_seconds: q.remediation_start_seconds ?? null,
      remediation_replay_until_seconds: q.remediation_replay_until_seconds ?? null,
      remediation_message: q.remediation_message ?? null,
    })
  );

  const quizProgress = (lessonData.quiz_progress ?? []).map(
    (progress: {
      question_id: string;
      selected_answer: number;
      answered_correctly: boolean;
    }) => ({
      question_id: progress.question_id,
      selected_answer: progress.selected_answer,
      answered_correctly: progress.answered_correctly,
    }),
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
    quizProgress,
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
