import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TaskDef = { id: string; order: number; title: string; description?: string };
type TaskCompletion = { completed_at: string };

/**
 * GET /api/mystery-school/foundation/[week]
 * Returns a single foundation week with its full task list and the
 * authenticated student's per-task completion state.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ week: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { week: weekParam } = await params;
  const weekNumber = parseInt(weekParam, 10);
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 12) {
    return NextResponse.json(
      { error: "week must be an integer between 1 and 12" },
      { status: 422 }
    );
  }

  // Verify active mystery school membership
  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (
    !member ||
    member.membership_type !== "mystery_school" ||
    member.membership_status !== "active"
  ) {
    return NextResponse.json(
      { error: "Mystery School membership required" },
      { status: 403 }
    );
  }

  // Get student record
  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student)
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  // Fetch week
  const { data: week, error: weekError } = await supabase
    .from("mystery_school_foundation_weeks")
    .select(
      "id, week_number, title, description, audio_url, beto_photo_url, tasks"
    )
    .eq("week_number", weekNumber)
    .eq("is_published", true)
    .single();

  if (weekError || !week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  // Fetch student progress for this week
  const { data: prog } = await supabase
    .from("student_foundation_progress")
    .select("task_completions, week_completed_at, completed_at")
    .eq("student_id", student.id)
    .eq("week_number", weekNumber)
    .maybeSingle();

  const taskDefs: TaskDef[] = Array.isArray(week.tasks) ? week.tasks : [];
  const taskCompletions: Record<string, TaskCompletion> =
    (prog?.task_completions as Record<string, TaskCompletion>) ?? {};

  const tasksDone = taskDefs.filter((t) => !!taskCompletions[t.id]).length;
  const tasksTotal = taskDefs.length;
  const allDone =
    tasksTotal === 0 ? !!prog?.week_completed_at : tasksDone >= tasksTotal;

  // Determine unlock (week 1 always; week N needs week N-1 complete)
  let unlocked = weekNumber === 1;
  if (weekNumber > 1) {
    const { data: prevProg } = await supabase
      .from("student_foundation_progress")
      .select("task_completions, week_completed_at")
      .eq("student_id", student.id)
      .eq("week_number", weekNumber - 1)
      .maybeSingle();

    if (prevProg) {
      const { data: prevWeekRow } = await supabase
        .from("mystery_school_foundation_weeks")
        .select("tasks")
        .eq("week_number", weekNumber - 1)
        .eq("is_published", true)
        .single();

      const prevTaskDefs: TaskDef[] = Array.isArray(prevWeekRow?.tasks)
        ? prevWeekRow.tasks
        : [];
      const prevCompletions: Record<string, TaskCompletion> =
        (prevProg.task_completions as Record<string, TaskCompletion>) ?? {};

      unlocked =
        prevTaskDefs.length === 0
          ? !!prevProg.week_completed_at
          : prevTaskDefs.every((t) => !!prevCompletions[t.id]);
    }
  }

  return NextResponse.json({
    id: week.id,
    week_number: week.week_number,
    title: week.title,
    description: week.description ?? null,
    audio_url: week.audio_url ?? null,
    beto_photo_url: week.beto_photo_url ?? null,
    tasks: taskDefs,
    unlocked,
    completed: allDone,
    completed_at: allDone ? (prog?.week_completed_at ?? prog?.completed_at ?? null) : null,
    task_completions: taskCompletions,
    tasks_done: tasksDone,
    tasks_total: tasksTotal,
  });
}
