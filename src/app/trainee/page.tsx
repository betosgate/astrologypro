import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
import {
  BookOpen,
  Calendar,
  Star,
  TrendingUp,
  User,
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Trophy,
  Clock,
} from "lucide-react";
import Link from "next/link";

const TABBY_USERNAME = process.env.NEXT_PUBLIC_TABBY_USERNAME ?? "tabby";

export const metadata = { title: "Trainee Dashboard - AstrologyPro" };

// ---------------------------------------------------------------------------
// Helper: relative time
// ---------------------------------------------------------------------------
function relativeTime(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "1 week ago";
  return `${diffWeeks} weeks ago`;
}

// ---------------------------------------------------------------------------
// Helper: format seconds as "Xh Ym"
// ---------------------------------------------------------------------------
function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProgramProgress = {
  program_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
  next_lesson_id: string | null;
  next_lesson_title: string | null;
  next_category_id: string | null;
  next_category_name: string | null;
  last_activity_at: string | null;
};

type LessonCompletion = {
  lesson_id: string;
  completed_at: string;
  training_lessons: {
    title: string;
    category_id: string;
    training_categories: { name: string } | null;
  } | null;
};

type QuizAttempt = {
  score: number;
  total_questions: number;
  passed: boolean;
  attempted_at: string;
};

type ActivityItem = {
  type: "completion" | "quiz";
  label: string;
  detail: string | null;
  time: string;
  href: string | null;
};

export default async function TraineeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select(
      "id, name, username, specialties, training_status, mentor_diviner_id, created_at"
    )
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const admin = createAdminClient();

  // ── All data fetched in parallel ──────────────────────────────────────────
  const [
    mentorResult,
    programProgressResult,
    recentCompletionsResult,
    quizStatsResult,
    timeSpentResult,
  ] = await Promise.all([
    // Mentor
    trainee.mentor_diviner_id
      ? admin
          .from("diviners")
          .select("display_name")
          .eq("id", trainee.mentor_diviner_id)
          .single()
      : Promise.resolve({ data: null }),

    // Overall progress summary (all programs for this user)
    admin
      .from("user_program_progress")
      .select(
        "program_id, total_lessons, completed_lessons, progress_pct, next_lesson_id, next_lesson_title, next_category_id, next_category_name, last_activity_at"
      )
      .eq("user_id", user.id),

    // Recent completions (last 5)
    admin
      .from("lesson_completions")
      .select(
        "lesson_id, completed_at, training_lessons(title, category_id, training_categories(name))"
      )
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5),

    // Quiz stats (last 20)
    admin
      .from("quiz_attempts")
      .select("score, total_questions, passed, attempted_at")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false })
      .limit(20),

    // Time spent (sum across all lesson_progress rows)
    admin
      .from("lesson_progress")
      .select("time_spent_seconds")
      .eq("user_id", user.id),
  ]);

  const mentorName = mentorResult.data
    ? (mentorResult.data as { display_name: string }).display_name
    : "Unassigned";

  const programProgress: ProgramProgress[] =
    (programProgressResult.data as ProgramProgress[] | null) ?? [];

  const recentCompletions: LessonCompletion[] =
    (recentCompletionsResult.data as LessonCompletion[] | null) ?? [];

  const quizAttempts: QuizAttempt[] =
    (quizStatsResult.data as QuizAttempt[] | null) ?? [];

  const timeSpentSeconds: number =
    (timeSpentResult.data ?? []).reduce(
      (sum: number, row: { time_spent_seconds: number | null }) =>
        sum + (row.time_spent_seconds ?? 0),
      0
    );

  // ── Aggregate progress across all programs ────────────────────────────────
  const totalLessons = programProgress.reduce(
    (s, p) => s + (p.total_lessons ?? 0),
    0
  );
  const completedLessons = programProgress.reduce(
    (s, p) => s + (p.completed_lessons ?? 0),
    0
  );
  const overallPct =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const programsStarted = programProgress.filter(
    (p) => p.completed_lessons > 0
  ).length;
  const programsCompleted = programProgress.filter(
    (p) => p.progress_pct >= 100
  ).length;

  const passedQuizCount = quizAttempts.filter((q) => q.passed).length;
  const quizAvgPct =
    quizAttempts.length > 0
      ? Math.round((passedQuizCount / quizAttempts.length) * 100)
      : null;

  // ── Next lesson: pick in-progress program first (lowest progress_pct > 0) ─
  let nextLessonProgram: ProgramProgress | null = null;
  const inProgressPrograms = programProgress.filter(
    (p) => p.progress_pct > 0 && p.progress_pct < 100
  );
  if (inProgressPrograms.length > 0) {
    nextLessonProgram = inProgressPrograms.reduce((a, b) =>
      a.progress_pct <= b.progress_pct ? a : b
    );
  } else if (programProgress.length > 0) {
    nextLessonProgram = programProgress[0];
  }

  // ── Build activity feed ───────────────────────────────────────────────────
  const completionItems: ActivityItem[] = recentCompletions.map((c) => ({
    type: "completion" as const,
    label: c.training_lessons?.title ?? "Lesson",
    detail: c.training_lessons?.training_categories?.name ?? null,
    time: c.completed_at,
    // We don't have programId here so link to training index
    href: `/trainee/training`,
  }));

  const recentPassedQuizzes = quizAttempts.filter((q) => q.passed).slice(0, 3);
  const quizItems: ActivityItem[] = recentPassedQuizzes.map((q) => ({
    type: "quiz" as const,
    label: `Quiz passed (${q.score}/${q.total_questions})`,
    detail: null,
    time: q.attempted_at,
    href: `/trainee/training`,
  }));

  // Merge and sort by time desc, show top 5
  const activityFeed: ActivityItem[] = [...completionItems, ...quizItems]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  const quickLinks = [
    {
      icon: Calendar,
      title: "Practice Sessions",
      description: "Schedule and review your supervised practice readings.",
      href: "/trainee/sessions",
    },
    {
      icon: TrendingUp,
      title: "My Progress",
      description: "Track your skills, completed modules, and feedback.",
      href: "/trainee/progress",
    },
    {
      icon: BookOpen,
      title: "Resources",
      description: "Study materials, guides, and reference charts.",
      href: "/trainee/resources",
    },
    {
      icon: User,
      title: "My Profile",
      description: "Manage your trainee profile and specialties.",
      href: "/trainee/profile",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Trainee Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {trainee.name}</p>
        </div>
        <Badge
          variant={
            trainee.training_status === "active" ? "default" : "secondary"
          }
        >
          {trainee.training_status}
        </Badge>
      </div>

      {/* ── Graduation CTA ──────────────────────────────────────────────────── */}
      {trainee.training_status === "graduated" && (
        <Card className="border-amber-300/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <GraduationCap className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Congratulations, Graduate!
                </p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                  You&apos;ve completed your training. Book your
                  post-graduation consultation with Tabby to discuss next
                  steps.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Link href={`/${TABBY_USERNAME}`}>Book with Tabby</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Training Progress Summary ────────────────────────────────────────── */}
      {programProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <CardTitle className="text-base">Training Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall completion</span>
                <span className="font-semibold tabular-nums">
                  {overallPct}% &mdash; {completedLessons} of {totalLessons} lessons
                </span>
              </div>
              <Progress value={overallPct} className="h-2.5" />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {programsStarted} of {programProgress.length}
                </span>{" "}
                {programProgress.length === 1 ? "program" : "programs"} started
              </span>
              {programsCompleted > 0 && (
                <span>
                  <span className="font-medium text-foreground">
                    {programsCompleted}
                  </span>{" "}
                  completed
                </span>
              )}
              {quizAvgPct !== null && (
                <span>
                  Quiz avg:{" "}
                  <span className="font-medium text-foreground">
                    {quizAvgPct}%
                  </span>
                </span>
              )}
              {timeSpentSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span className="font-medium text-foreground">
                    {formatDuration(timeSpentSeconds)}
                  </span>{" "}
                  total time
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Continue Learning / Begin / Graduate CTA ────────────────────────── */}
      {trainee.training_status !== "graduated" && (
        <>
          {programProgress.length === 0 ? (
            // No programs started yet
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PlayCircle className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Begin Your Training</p>
                    <p className="text-sm text-muted-foreground">
                      Your training programs are ready. Start your first lesson
                      to begin tracking progress.
                    </p>
                  </div>
                </div>
                <Button asChild className="shrink-0">
                  <Link href="/trainee/training">View Programs</Link>
                </Button>
              </CardContent>
            </Card>
          ) : nextLessonProgram?.next_lesson_id ? (
            // In-progress: show continue learning
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PlayCircle className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Continue Learning
                    </p>
                    <p className="font-semibold">
                      {nextLessonProgram.next_lesson_title}
                    </p>
                    {nextLessonProgram.next_category_name && (
                      <p className="text-sm text-muted-foreground">
                        {nextLessonProgram.next_category_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild>
                    <Link
                      href={
                        nextLessonProgram.next_category_id
                          ? `/trainee/training/${nextLessonProgram.program_id}/${nextLessonProgram.next_category_id}/${nextLessonProgram.next_lesson_id}`
                          : `/trainee/training/${nextLessonProgram.program_id}`
                      }
                    >
                      Start Lesson
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/trainee/training">View All</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : programsCompleted > 0 && programsCompleted === programProgress.length ? (
            // All programs completed — awaiting graduation status
            <Card className="border-green-300/50 bg-green-50/30 dark:border-green-700/50 dark:bg-green-950/20">
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <GraduationCap className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Training Complete
                    </p>
                    <p className="text-sm text-green-800/80 dark:text-green-200/80">
                      You&apos;ve finished all training programs. Await mentor
                      review and graduation confirmation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      {/* ── Mentor card ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Mentor</CardDescription>
          <CardTitle className="text-base">{mentorName}</CardTitle>
        </CardHeader>
        {!trainee.mentor_diviner_id && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No mentor assigned yet. An administrator will connect you with a
              diviner mentor shortly.
            </p>
          </CardContent>
        )}
      </Card>

      {/* ── Specialties ─────────────────────────────────────────────────────── */}
      {trainee.specialties && trainee.specialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trainee.specialties.map((s: string) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </div>
      )}

      {/* ── Quick links ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="transition-colors hover:border-primary/30"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      {activityFeed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activityFeed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {item.type === "quiz" ? (
                      <Trophy className="size-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="size-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {item.type === "quiz" ? (
                        <span className="font-medium">{item.label}</span>
                      ) : (
                        <>
                          Completed{" "}
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="font-medium underline-offset-2 hover:underline"
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <span className="font-medium">{item.label}</span>
                          )}
                        </>
                      )}
                      {item.detail && (
                        <span className="text-muted-foreground">
                          {" "}
                          &mdash; {item.detail}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {relativeTime(item.time)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
