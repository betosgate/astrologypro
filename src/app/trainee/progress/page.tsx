import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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
  CheckCircle2, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Video, 
  Clock, 
  ChevronRight,
  Lock,
  Trophy,
  Calendar,
  MonitorPlay,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Progress - AstrologyPro" };

// ---------------------------------------------------------------------------
// Types (Matching the programs API)
// ---------------------------------------------------------------------------
type TrainingLessonSummary = {
  id: string;
  title: string;
  completed: boolean;
  in_progress?: boolean;
  is_locked: boolean;
  quiz_passed: boolean | null;
};

type TrainingCategorySummary = {
  id: string;
  name: string;
  completed: boolean;
  is_locked: boolean;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
  lessons: TrainingLessonSummary[];
};

type TrainingProgramSummary = {
  id: string;
  name: string;
  progress_pct: number;
  completed_lessons: number;
  total_lessons: number;
  categories: TrainingCategorySummary[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function fetchTrainingPrograms(): Promise<TrainingProgramSummary[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

  const res = await fetch(`${base}/api/trainee/training/programs`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.programs) ? json.programs : [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function TraineeProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, training_status, created_at, graduated_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const admin = createAdminClient();

  // 1. Fetch Parallel Data
  const [trainingPrograms, practiceResult, quizAttemptsResult, activityResult] = await Promise.all([
    fetchTrainingPrograms(),
    // Practice Sessions (bookings for this trainee as a client)
    admin
      .from("bookings")
      .select("id, status, scheduled_at")
      .eq("client_email", user.email!)
      .order("scheduled_at", { ascending: false }),
    // Quiz attempts
    admin
      .from("quiz_attempts")
      .select("score, passed, attempted_at, training_lessons(title)")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false }),
    // Add additional booking sources if needed for practice
    admin
      .from("admin_bookings")
      .select("id, status, scheduled_at")
      .eq("client_email", user.email!)
      .order("scheduled_at", { ascending: false }),
  ]);

  // Merge practice sessions from both standard and admin tables
  const allPractice = [
    ...(practiceResult.data ?? []).map(b => ({ ...b, type: "standard" })),
    ...(activityResult.data ?? []).map(b => ({ ...b, type: "admin" }))
  ].sort((a,b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const completedPractice = allPractice.filter(b => b.status === "completed").length;
  const upcomingPractice = allPractice.filter(b => b.status === "confirmed" || b.status === "pending").length;

  // Aggregate program stats
  const totalLessons = trainingPrograms.reduce((s, p) => s + p.total_lessons, 0);
  const completedLessons = trainingPrograms.reduce((s, p) => s + p.completed_lessons, 0);
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  const quizAttempts = quizAttemptsResult.data ?? [];
  const avgQuizScore = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((s, a) => s + (a.score || 0), 0) / quizAttempts.length)
    : null;

  const isGraduated = !!trainee.graduated_at;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Progress</h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive overview of your training journey and session history.
          </p>
        </div>
        {isGraduated && (
          <Button asChild className="shrink-0 bg-primary/95 hover:bg-primary shadow-lg shadow-primary/20">
            <Link href="/trainee/certificate">
              <Award className="mr-2 size-4" />
              View Diploma
            </Link>
          </Button>
        )}
      </div>

      {/* Graduation Banner */}
      {isGraduated && (
        <Card className="border-primary/30 bg-primary/[0.03] overflow-hidden relative">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <Trophy className="size-24 scale-150 rotate-12" />
          </div>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Award className="size-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary tracking-tight">Congratulations!</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                You have successfully completed the professional divination course. 
                Your certification is now available for download.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2 space-y-0.5">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 overflow-hidden">
              <BookOpen className="size-3 text-primary shrink-0" />
              Course Progress
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {completedLessons}<span className="text-sm font-normal text-muted-foreground ml-1">/ {totalLessons}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallPct} className="h-1.5 bg-muted/50" />
            <p className="mt-2 text-xs font-semibold text-primary">{overallPct}% Complete</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2 space-y-0.5">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Video className="size-3 text-emerald-500 shrink-0" />
              Practice Sessions
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{completedPractice}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total completed</span>
              {upcomingPractice > 0 && (
                <span className="text-emerald-600 font-medium">+{upcomingPractice} upcoming</span>
              )}
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1">
              <Clock className="size-2.5" />
              Required for graduation
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2 space-y-0.5">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-amber-500 shrink-0" />
              Quiz Performance
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{avgQuizScore !== null ? `${avgQuizScore}%` : "---"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Average across all</span>
              <span className="font-medium">{quizAttempts.length} quizzes</span>
            </div>
            <Progress value={avgQuizScore ?? 0} className="h-1.5 mt-2 bg-muted/50" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2 space-y-0.5">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="size-3 text-blue-500 shrink-0" />
              Status
            </CardDescription>
            <CardTitle className="text-lg font-bold capitalize">
              {isGraduated ? "Graduated" : trainee.training_status}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" />
              Started {formatDate(trainee.created_at)}
            </p>
            {trainee.graduated_at && (
              <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter">
                Completed {formatDate(trainee.graduated_at)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Module Progress Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-bold tracking-tight">Curriculum Modules</h2>
            <Link href="/trainee/training" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              Go to Training <ChevronRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-6">
            {trainingPrograms.map(program => (
              <div key={program.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50 border">
                    <GraduationCap className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-none">{program.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                      {program.completed_lessons} of {program.total_lessons} lessons finished 
                      {program.progress_pct > 0 && ` (${program.progress_pct}%)`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {program.categories.map(category => (
                    <Card key={category.id} className={cn(
                      "bg-card/30 border-border/40 transition-all hover:border-border/80",
                      category.is_locked && "opacity-60 grayscale-[0.5]"
                    )}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-xs font-bold truncate">{category.name}</CardTitle>
                            <CardDescription className="text-[10px] font-medium flex items-center gap-1 mt-0.5">
                              {category.completed_lessons} / {category.total_lessons} Lessons
                            </CardDescription>
                          </div>
                          {category.is_locked ? (
                            <Lock className="size-3.5 text-muted-foreground" />
                          ) : category.completed ? (
                            <CheckCircle2 className="size-3.5 text-primary" />
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Progress value={category.progress_pct} className="h-1 bg-muted/40" />
                        
                        <div className="mt-3 flex flex-col gap-1.5">
                          {category.lessons.slice(0, 3).map(lesson => (
                            <div key={lesson.id} className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "text-[10px] truncate",
                                lesson.completed ? "text-primary font-medium" : "text-muted-foreground"
                              )}>
                                {lesson.title}
                              </span>
                              {lesson.completed && (
                                <CheckCircle2 className="size-2.5 text-primary shrink-0" />
                              )}
                              {lesson.is_locked && (
                                <Lock className="size-2.5 text-muted-foreground/40 shrink-0" />
                              )}
                            </div>
                          ))}
                          {category.total_lessons > 3 && (
                            <span className="text-[9px] text-muted-foreground italic">
                              + {category.total_lessons - 3} more lessons
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity & Sidebars */}
        <div className="space-y-6">
          {/* Recent Quiz Activity */}
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                Recent Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {quizAttempts.length > 0 ? (
                  quizAttempts.slice(0, 5).map((attempt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 px-4 transition-colors hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold truncate">
                          {(attempt.training_lessons as any)?.title || "Untitled Lesson"}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {formatDate(attempt.attempted_at)}
                        </p>
                      </div>
                      <Badge variant={attempt.passed ? "default" : "secondary"} className="text-[9px] h-5 tabular-nums">
                        {attempt.score}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center px-4">
                    <p className="text-[11px] text-muted-foreground">No quiz attempts yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Practice Activity */}
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MonitorPlay className="size-4 text-emerald-500" />
                Practice Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {allPractice.length > 0 ? (
                  allPractice.slice(0, 5).map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 px-4 transition-colors hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold lowercase first-letter:uppercase truncate">
                          {session.status} Reading
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {formatDate(session.scheduled_at)}
                        </p>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'secondary' : 'outline'} className="text-[9px] h-5 capitalize">
                        {session.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center px-4">
                    <p className="text-[11px] text-muted-foreground">No sessions scheduled.</p>
                    <Button variant="link" size="sm" className="text-[10px] h-auto p-0 mt-1" asChild>
                      <Link href="/trainee/sessions">Learn how to schedule</Link>
                    </Button>
                  </div>
                )}
              </div>
              {allPractice.length > 5 && (
                <div className="p-2 border-t text-center">
                  <Button variant="ghost" size="xs" className="text-[10px] w-full" asChild>
                    <Link href="/trainee/sessions">View All Sessions</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
