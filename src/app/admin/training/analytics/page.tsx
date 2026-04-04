import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Training Analytics — Admin" };
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function TrainingAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) redirect("/");

  const admin = createAdminClient();

  const [traineesRes, progressRes, lessonsRes] = await Promise.all([
    admin.from("trainees").select("id, training_status, onboarding_completed, graduated_at, created_at"),
    admin.from("trainee_lesson_progress").select("trainee_id, lesson_id, completed_at, quiz_score, quiz_passed"),
    admin.from("training_lessons").select("id, title, category_id, is_active"),
  ]);

  const trainees = traineesRes.data ?? [];
  const progress = progressRes.data ?? [];
  const lessons = lessonsRes.data ?? [];

  // Trainee counts by status
  const statusCounts: Record<string, number> = {};
  for (const t of trainees) {
    statusCounts[t.training_status] = (statusCounts[t.training_status] ?? 0) + 1;
  }
  const totalTrainees = trainees.length;
  const onboardingCompleted = trainees.filter((t) => t.onboarding_completed).length;

  // Lesson completion rates
  const activeLessons = lessons.filter((l) => l.is_active);
  const completedByLesson: Record<string, number> = {};
  const quizPassByLesson: Record<string, { passed: number; total: number }> = {};
  for (const p of progress) {
    if (p.completed_at) {
      completedByLesson[p.lesson_id] = (completedByLesson[p.lesson_id] ?? 0) + 1;
    }
    if (p.quiz_score !== null) {
      if (!quizPassByLesson[p.lesson_id]) quizPassByLesson[p.lesson_id] = { passed: 0, total: 0 };
      quizPassByLesson[p.lesson_id].total += 1;
      if (p.quiz_passed) quizPassByLesson[p.lesson_id].passed += 1;
    }
  }

  // Overall quiz stats
  const totalQuizAttempts = progress.filter((p) => p.quiz_score !== null).length;
  const totalQuizPassed = progress.filter((p) => p.quiz_passed === true).length;
  const overallPassRate = totalQuizAttempts > 0 ? Math.round((totalQuizPassed / totalQuizAttempts) * 100) : null;

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    graduated: "bg-blue-500/10 text-blue-600",
    pending: "bg-yellow-500/10 text-yellow-600",
    paused: "bg-orange-500/10 text-orange-600",
    cancelled: "bg-red-500/10 text-red-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Analytics</h1>
        <p className="text-muted-foreground">Overview of trainee progress, lesson completion, and quiz performance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trainees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTrainees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Onboarding Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{onboardingCompleted}</p>
            <p className="text-xs text-muted-foreground">
              {totalTrainees > 0 ? Math.round((onboardingCompleted / totalTrainees) * 100) : 0}% of trainees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuizAttempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overallPassRate !== null ? `${overallPassRate}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">{totalQuizPassed} passed of {totalQuizAttempts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trainees by status */}
      <Card>
        <CardHeader>
          <CardTitle>Trainees by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-sm text-muted-foreground">No trainees yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${STATUS_COLORS[status] ?? ""}`}>
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-sm font-medium capitalize">{status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson completion table */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Completion Rates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeLessons.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No active lessons.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Lesson</th>
                    <th className="px-4 py-2 text-left font-medium">Completions</th>
                    <th className="px-4 py-2 text-left font-medium">Completion Rate</th>
                    <th className="px-4 py-2 text-left font-medium">Quiz Attempts</th>
                    <th className="px-4 py-2 text-left font-medium">Quiz Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLessons.map((lesson) => {
                    const completed = completedByLesson[lesson.id] ?? 0;
                    const completionRate = totalTrainees > 0 ? Math.round((completed / totalTrainees) * 100) : 0;
                    const quizStats = quizPassByLesson[lesson.id];
                    const quizPassRate = quizStats && quizStats.total > 0 ? Math.round((quizStats.passed / quizStats.total) * 100) : null;
                    return (
                      <tr key={lesson.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">{lesson.title}</td>
                        <td className="px-4 py-2 tabular-nums">{completed}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
                            </div>
                            <span className="tabular-nums text-xs">{completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{quizStats?.total ?? 0}</td>
                        <td className="px-4 py-2">
                          {quizPassRate !== null ? (
                            <Badge variant="outline" className={quizPassRate >= 70 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                              {quizPassRate}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
