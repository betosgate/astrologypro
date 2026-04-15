import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ClipboardList,
  Clock,
  TrendingUp,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quiz History - AstrologyPro" };

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function scoreColor(pct: number) {
  if (pct >= 90) return "text-emerald-500";
  if (pct >= 70) return "text-sky-500";
  if (pct >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBadge(pct: number) {
  if (pct >= 90) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/25";
  if (pct >= 70) return "bg-sky-500/10 text-sky-600 border-sky-500/25";
  if (pct >= 50) return "bg-amber-500/10 text-amber-600 border-amber-500/25";
  return "bg-red-500/10 text-red-600 border-red-500/25";
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function QuizHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, training_status")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  const admin = createAdminClient();

  // Fetch all quiz attempts with lesson title
  const { data: attempts } = await admin
    .from("quiz_attempts")
    .select(`
      id,
      lesson_id,
      score,
      total_questions,
      passed,
      attempted_at,
      time_taken_seconds,
      attempt_number,
      lesson:training_lessons!lesson_id(title)
    `)
    .eq("user_id", user.id)
    .order("attempted_at", { ascending: false });

  const rows = (attempts ?? []) as Array<{
    id: string;
    lesson_id: string;
    score: number;
    total_questions: number;
    passed: boolean;
    attempted_at: string;
    time_taken_seconds: number;
    attempt_number: number;
    lesson: { title: string } | null;
  }>;

  // Aggregate stats
  const total = rows.length;
  const passed = rows.filter((r) => r.passed).length;
  const failed = total - passed;
  const avgScore = total > 0
    ? Math.round(rows.reduce((sum, r) => sum + (r.score / r.total_questions) * 100, 0) / total)
    : 0;
  const totalTime = rows.reduce((sum, r) => sum + (r.time_taken_seconds ?? 0), 0);
  const bestScore = total > 0
    ? Math.max(...rows.map((r) => Math.round((r.score / r.total_questions) * 100)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quiz History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your complete quiz attempt record across all lessons.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ClipboardList className="size-3.5" />
              <span className="text-xs font-medium">Total Attempts</span>
            </div>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="size-3.5" />
              <span className="text-xs font-medium">Passed</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{passed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="size-3.5" />
              <span className="text-xs font-medium">Avg Score</span>
            </div>
            <p className={`text-3xl font-bold ${scoreColor(avgScore)}`}>{avgScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Star className="size-3.5" />
              <span className="text-xs font-medium">Best Score</span>
            </div>
            <p className={`text-3xl font-bold ${scoreColor(bestScore)}`}>{bestScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats */}
      {total > 0 && (
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="size-3" />
            Total time: {fmtDuration(totalTime)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Pass rate: {total > 0 ? Math.round((passed / total) * 100) : 0}%
          </span>
          {failed > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/5 px-3 py-1 text-xs font-medium text-red-600">
              <XCircle className="size-3" />
              {failed} retake{failed !== 1 ? "s" : ""} needed
            </span>
          )}
          {trainee.training_status === "graduated" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
              <Trophy className="size-3" />
              Graduated — all quizzes complete
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete lessons with quizzes to see your history here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attempt list */}
      {total > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">All Attempts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {rows.map((attempt, idx) => {
                const pct = Math.round((attempt.score / attempt.total_questions) * 100);
                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground w-6 text-right">
                        {rows.length - idx}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attempt.lesson?.title ?? "Unknown Lesson"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {fmtDate(attempt.attempted_at)}
                          </span>
                          {attempt.time_taken_seconds > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              · {fmtDuration(attempt.time_taken_seconds)}
                            </span>
                          )}
                          {attempt.attempt_number > 1 && (
                            <span className="text-[10px] text-muted-foreground">
                              · Attempt #{attempt.attempt_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${scoreBadge(pct)}`}
                      >
                        {attempt.score}/{attempt.total_questions} · {pct}%
                      </Badge>
                      {attempt.passed ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-red-500 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
