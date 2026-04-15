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
    <div className="space-y-4">
      {/* Header + badges in one row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quiz History</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your complete quiz attempt record across all lessons.
          </p>
        </div>
        {total > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Clock className="size-3" />
              {fmtDuration(totalTime)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Pass rate: {Math.round((passed / total) * 100)}%
            </span>
            {failed > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/5 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
                <XCircle className="size-3" />
                {failed} retake{failed !== 1 ? "s" : ""}
              </span>
            )}
            {trainee.training_status === "graduated" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                <Trophy className="size-3" />
                Graduated
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats row — compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ClipboardList, label: "Total Attempts", value: String(total), color: "text-muted-foreground" },
          { icon: CheckCircle2, label: "Passed", value: String(passed), color: "text-emerald-600" },
          { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%`, color: scoreColor(avgScore) },
          { icon: Star, label: "Best Score", value: `${bestScore}%`, color: scoreColor(bestScore) },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <Icon className={`size-4 shrink-0 ${color}`} />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground leading-none">{label}</p>
                <p className={`text-xl font-bold leading-tight mt-0.5 ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
