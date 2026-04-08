import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

type TaskDef = { id: string; order: number; title: string; description?: string };
type TaskCompletion = { completed_at: string };

/**
 * GET /api/mystery-school/foundation
 * Returns all 12 foundation weeks with per-task completion status.
 */
export async function GET() {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = result.student as unknown as {
    id: string;
    training_status: string;
    enrolled_at: string;
    start_quarter: string;
    entry_quarter?: string | null;
  };

  // Get published weeks (include description and tasks columns)
  const { data: weeks, error: weeksError } = await supabase
    .from("mystery_school_foundation_weeks")
    .select(
      "id, week_number, title, description, audio_url, beto_photo_url, tasks"
    )
    .eq("is_published", true)
    .order("week_number");

  if (weeksError)
    return NextResponse.json({ error: weeksError.message }, { status: 500 });

  // Get student progress rows (includes task_completions and week_completed_at)
  const { data: progress } = await supabase
    .from("student_foundation_progress")
    .select("week_number, task_completions, week_completed_at, completed_at")
    .eq("student_id", student.id);

  const progressByWeek = new Map(
    (progress ?? []).map((p) => [p.week_number, p])
  );

  // Build enriched week list
  const weeksWithStatus = (weeks ?? []).map((week, index) => {
    const prog = progressByWeek.get(week.week_number);
    const taskDefs: TaskDef[] = Array.isArray(week.tasks) ? week.tasks : [];
    const taskCompletions: Record<string, TaskCompletion> =
      (prog?.task_completions as Record<string, TaskCompletion>) ?? {};

    const tasksDone = taskDefs.filter((t) => !!taskCompletions[t.id]).length;
    const tasksTotal = taskDefs.length;

    // A week is "complete" when all tasks are done (or it was completed
    // via the legacy flow before tasks were added, and no tasks exist).
    const allTasksDone =
      tasksTotal === 0
        ? !!prog?.week_completed_at
        : tasksDone >= tasksTotal;

    const completedAt: string | null =
      prog?.week_completed_at ?? prog?.completed_at ?? null;

    // Unlock: week 1 is always unlocked; week N needs week N-1 complete.
    const prevCompleted =
      index === 0 ||
      (() => {
        const prevProg = progressByWeek.get(week.week_number - 1);
        if (!prevProg) return false;
        const prevWeek = (weeks ?? [])[index - 1];
        const prevTaskDefs: TaskDef[] = Array.isArray(prevWeek?.tasks)
          ? prevWeek.tasks
          : [];
        const prevCompletions: Record<string, TaskCompletion> =
          (prevProg.task_completions as Record<string, TaskCompletion>) ?? {};
        if (prevTaskDefs.length === 0) return !!prevProg.week_completed_at;
        return prevTaskDefs.every((t) => !!prevCompletions[t.id]);
      })();

    return {
      id: week.id,
      week_number: week.week_number,
      title: week.title,
      description: week.description ?? null,
      audio_url: week.audio_url ?? null,
      beto_photo_url: week.beto_photo_url ?? null,
      tasks: taskDefs,
      unlocked: prevCompleted,
      completed: allTasksDone,
      completed_at: allTasksDone ? completedAt : null,
      task_completions: taskCompletions,
      tasks_done: tasksDone,
      tasks_total: tasksTotal,
    };
  });

  const completedCount = weeksWithStatus.filter((w) => w.completed).length;
  const q1Complete = completedCount >= 12 && weeksWithStatus.length > 0;

  return NextResponse.json({
    student: {
      id: student.id,
      status: student.training_status,
      enrolled_at: student.enrolled_at,
      start_quarter: student.start_quarter,
      entry_quarter: (student as Record<string, unknown>).entry_quarter ?? null,
    },
    weeks: weeksWithStatus,
    total_weeks: 12,
    completed_count: completedCount,
    q1_complete: q1Complete,
  });
}
