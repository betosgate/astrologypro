import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import {
  LessonViewerClient,
  type LessonViewerProps,
  type SidebarLesson,
} from "@/components/trainee/lesson-viewer-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ categoryId: string; lessonId: string }>;
}

/**
 * Normalize quiz options to `{ text: string }[]` — matches the trainee
 * lesson page's normalizer so the shared viewer receives identical shapes.
 */
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
      typeof (option as { text: unknown }).text === "string"
    ) {
      const text = (option as { text: string }).text.trim();
      return text ? [{ text }] : [];
    }
    return [];
  });
}

/**
 * Fetch the lesson detail through the existing trainee API so the shared
 * viewer gets the exact same payload shape as the trainee portal:
 *   - lesson + audio_url + content + video + pdf
 *   - assets + videos + quiz questions (without correct_answer)
 *   - completion + quiz_passed
 *   - sequential lock state (403 → locked)
 *
 * Mystery School access is enforced upstream by the layout
 * (requireMysterySchoolAccess). The trainee lesson endpoint itself does not
 * apply role-based gating to the lesson body — it only enforces sequential
 * lock and is_active. We therefore reuse it directly without reimplementing
 * the lesson read.
 */
async function fetchLessonDetail(
  lessonId: string
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

export default async function TrainingLessonPage({ params }: Props) {
  const { categoryId, lessonId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The Mystery School layout already gates access. We re-check defensively
  // because page.tsx files in nested layouts can re-render independently.
  const access = await requireMysterySchoolAccess();
  if (!access) redirect("/mystery-school/enroll");

  // ── 1. Fetch lesson via the shared trainee API ─────────────────────────────
  const { lesson, locked } = await fetchLessonDetail(lessonId);
  if (locked) redirect(`/mystery-school/training`);
  if (!lesson || lesson.category_id !== categoryId) notFound();

  // ── 2. Sidebar — sibling lessons in this week-category ─────────────────────
  // We fetch directly via the admin client (the trainee programs endpoint is
  // overkill here and would re-enumerate every program). Per-lesson completion
  // flags are needed for the sidebar checkmark state.
  const admin = createAdminClient();
  const [siblingsRes, completionsRes, categoryRes] = await Promise.all([
    admin
      .from("training_lessons")
      .select("id, title, priority")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("priority", { ascending: true }),
    admin
      .from("lesson_completions")
      .select("lesson_id")
      .eq("user_id", user.id),
    admin
      .from("training_categories")
      .select("id, name, training_id")
      .eq("id", categoryId)
      .single(),
  ]);

  const siblings = siblingsRes.data ?? [];
  const completedSet = new Set(
    (completionsRes.data ?? []).map((row) => row.lesson_id)
  );
  const category = categoryRes.data;

  const sidebarLessons: SidebarLesson[] = siblings.map((s) => ({
    id: s.id,
    title: s.title,
    completed: completedSet.has(s.id),
    is_locked: false, // sequential lock is enforced by the lesson API, not here
    href: `/mystery-school/training/${categoryId}/${s.id}`,
    isActive: s.id === lessonId,
  }));

  // ── 3. Compute next-route + label ──────────────────────────────────────────
  // If there's another lesson after this one in the same week, link to it.
  // Otherwise, send the learner back to the Mystery School training overview
  // so they see the next week unlock.
  const currentIdx = siblings.findIndex((s) => s.id === lessonId);
  const nextSibling =
    currentIdx >= 0 && currentIdx < siblings.length - 1
      ? siblings[currentIdx + 1]
      : null;
  const nextRoute = nextSibling
    ? `/mystery-school/training/${categoryId}/${nextSibling.id}`
    : `/mystery-school/training`;
  const nextLabel = nextSibling ? "Next lesson" : "Back to Mystery School";

  // ── 4. Quiz shaping (mirrors the trainee page) ─────────────────────────────
  const quizQuestions = (lesson.quiz_questions ?? []).map(
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
      remediation_replay_until_seconds:
        q.remediation_replay_until_seconds ?? null,
      remediation_message: q.remediation_message ?? null,
    })
  );

  const quizProgress = (lesson.quiz_progress ?? []).map(
    (p: {
      question_id: string;
      selected_answer: number;
      answered_correctly: boolean;
    }) => ({
      question_id: p.question_id,
      selected_answer: p.selected_answer,
      answered_correctly: p.answered_correctly,
    })
  );

  // The shared viewer expects `programId` for breadcrumbs/routing. We don't
  // have one in the URL, so synthesize from category.training_id (still a
  // valid UUID — never rendered to the user via this page).
  const programId = category?.training_id ?? "";

  const viewerProps: LessonViewerProps = {
    lessonId,
    programId,
    categoryId,
    title: lesson.title,
    description: lesson.description ?? null,
    content: lesson.content ?? null,
    videoUrl: lesson.video_url ?? null,
    pdfUrl: lesson.pdf_url ?? null,
    audioUrl: lesson.audio_url ?? null,
    durationMins: lesson.duration_mins ?? null,
    videos: lesson.videos ?? [],
    assets: lesson.assets ?? [],
    quizQuestions,
    quizProgress,
    quizPassed: lesson.quiz_passed === true,
    quizLastScore: lesson.quiz_last_score ?? null,
    quizLastTotal: lesson.quiz_last_total ?? null,
    isCompleted: lesson.completed === true,
    nextRoute,
    nextLabel,
    sidebarLessons,
    triggers: lesson.triggers ?? [],
    lastPositionSeconds: lesson.last_position_seconds ?? 0,
  };

  return (
    <div className="space-y-5">
      {/* Mystery-School-themed breadcrumb shell — keeps the learner inside the
          Mystery School visual context even though the inner viewer is shared
          with the trainee portal. */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/mystery-school/training"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Mystery School
        </Link>
        {category && (
          <>
            <span className="text-foreground/40">/</span>
            <span className="truncate max-w-[160px]">{category.name}</span>
          </>
        )}
        <span className="text-foreground/40">/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {lesson.title}
        </span>
      </div>

      <LessonViewerClient {...viewerProps} />
    </div>
  );
}
