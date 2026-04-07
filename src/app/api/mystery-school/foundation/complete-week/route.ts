import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TaskDef = { id: string; order: number; title: string; description?: string };
type TaskCompletion = { completed_at: string };

/**
 * POST /api/mystery-school/foundation/complete-week
 * Marks a foundation week as complete for the authenticated student.
 *
 * A week can only be completed when ALL tasks for that week are done.
 * This endpoint is preserved for backward compatibility but enforces the
 * same task-completion rule as /foundation/complete-task.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { weekNumber } = (body as { weekNumber?: unknown }) ?? {};
  if (!weekNumber || typeof weekNumber !== "number" || weekNumber < 1 || weekNumber > 12 || !Number.isInteger(weekNumber)) {
    return NextResponse.json({ error: "weekNumber must be an integer between 1 and 12" }, { status: 400 });
  }

  // Verify active mystery school membership
  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_type !== "mystery_school" || member.membership_status !== "active") {
    return NextResponse.json({ error: "Mystery School membership required" }, { status: 403 });
  }

  // Get student record
  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id, training_status")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  // Fetch the week definition so we can verify task completion
  const { data: weekDef, error: weekError } = await supabase
    .from("mystery_school_foundation_weeks")
    .select("id, week_number, tasks")
    .eq("week_number", weekNumber)
    .eq("is_published", true)
    .single();

  if (weekError || !weekDef) {
    return NextResponse.json({ error: "Week not found or not published" }, { status: 404 });
  }

  const taskDefs: TaskDef[] = Array.isArray(weekDef.tasks) ? weekDef.tasks : [];

  // Check week is unlocked: week 1 always; week N requires week N-1 fully complete
  if (weekNumber > 1) {
    const { data: prevProg } = await supabase
      .from("student_foundation_progress")
      .select("task_completions, week_completed_at")
      .eq("student_id", student.id)
      .eq("week_number", weekNumber - 1)
      .maybeSingle();

    if (!prevProg) {
      return NextResponse.json({ error: "Previous week must be completed first" }, { status: 409 });
    }

    const { data: prevWeekDef } = await supabase
      .from("mystery_school_foundation_weeks")
      .select("tasks")
      .eq("week_number", weekNumber - 1)
      .eq("is_published", true)
      .single();

    const prevTaskDefs: TaskDef[] = Array.isArray(prevWeekDef?.tasks) ? prevWeekDef.tasks : [];
    const prevCompletions: Record<string, TaskCompletion> =
      (prevProg.task_completions as Record<string, TaskCompletion>) ?? {};

    const prevComplete =
      prevTaskDefs.length === 0
        ? !!prevProg.week_completed_at
        : prevTaskDefs.every((t) => !!prevCompletions[t.id]);

    if (!prevComplete) {
      return NextResponse.json({ error: "Previous week must be completed first" }, { status: 409 });
    }
  }

  // Fetch (or check) the current week's progress row
  const { data: currentProg } = await supabase
    .from("student_foundation_progress")
    .select("id, task_completions, week_completed_at")
    .eq("student_id", student.id)
    .eq("week_number", weekNumber)
    .maybeSingle();

  // Enforce: all tasks must be done before week can be marked complete
  if (taskDefs.length > 0) {
    const completions: Record<string, TaskCompletion> =
      (currentProg?.task_completions as Record<string, TaskCompletion>) ?? {};
    const allTasksDone = taskDefs.every((t) => !!completions[t.id]);
    if (!allTasksDone) {
      const doneTasks = taskDefs.filter((t) => !!completions[t.id]).length;
      return NextResponse.json(
        {
          error: "All tasks must be completed before marking the week complete",
          tasks_done: doneTasks,
          tasks_total: taskDefs.length,
        },
        { status: 409 }
      );
    }
  }

  // Idempotent: if already marked complete, return success
  if (currentProg?.week_completed_at) {
    return NextResponse.json({ success: true, weekNumber, already_complete: true });
  }

  const now = new Date().toISOString();

  if (currentProg) {
    // Row exists (tasks were tracked) — stamp week_completed_at
    const { error: updateError } = await supabase
      .from("student_foundation_progress")
      .update({ week_completed_at: now, completed_at: now })
      .eq("id", currentProg.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  } else {
    // No row yet (week has no tasks) — insert now
    const { error: insertError } = await supabase
      .from("student_foundation_progress")
      .upsert(
        { student_id: student.id, week_number: weekNumber, week_completed_at: now, completed_at: now },
        { onConflict: "student_id,week_number" }
      );

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // If all 12 weeks complete, update training_status to "decans"
  const { count: doneCount } = await supabase
    .from("student_foundation_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .not("week_completed_at", "is", null);

  if ((doneCount ?? 0) >= 12 && student.training_status === "foundation") {
    await supabase
      .from("mystery_school_students")
      .update({ training_status: "decans" })
      .eq("id", student.id)
      .eq("training_status", "foundation");
  }

  return NextResponse.json({ success: true, weekNumber });
}
