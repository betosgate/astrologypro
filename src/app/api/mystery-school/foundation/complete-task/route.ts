import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

type TaskDef = { id: string; order: number; title: string; description?: string };
type TaskCompletion = { completed_at: string };

/**
 * POST /api/mystery-school/foundation/complete-task
 * Body: { week_number: number, task_id: string }
 *
 * Marks a single task as complete for the authenticated student.
 * Automatically sets week_completed_at when all tasks in the week are done.
 * If week 12 completes, advances training_status to "decans".
 */
export async function POST(req: NextRequest) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { week_number, task_id } =
    (body as { week_number?: unknown; task_id?: unknown }) ?? {};

  if (
    typeof week_number !== "number" ||
    week_number < 1 ||
    week_number > 12 ||
    !Number.isInteger(week_number)
  ) {
    return NextResponse.json(
      { error: "week_number must be an integer between 1 and 12" },
      { status: 422 }
    );
  }

  if (typeof task_id !== "string" || task_id.trim() === "") {
    return NextResponse.json({ error: "task_id is required" }, { status: 422 });
  }

  const student = result.student as unknown as { id: string; training_status: string };

  // Fetch the week to verify it's published and task_id exists
  const { data: week, error: weekError } = await supabase
    .from("mystery_school_foundation_weeks")
    .select("id, week_number, tasks")
    .eq("week_number", week_number)
    .eq("is_published", true)
    .single();

  if (weekError || !week) {
    return NextResponse.json(
      { error: "Week not found or not published" },
      { status: 404 }
    );
  }

  const taskDefs: TaskDef[] = Array.isArray(week.tasks) ? week.tasks : [];
  const taskExists = taskDefs.some((t) => t.id === task_id);
  if (!taskExists) {
    return NextResponse.json(
      { error: "task_id does not exist in this week" },
      { status: 422 }
    );
  }

  // Verify week is unlocked: week 1 always, week N requires week N-1 complete.
  if (week_number > 1) {
    const { data: prevProg } = await supabase
      .from("student_foundation_progress")
      .select("task_completions, week_completed_at")
      .eq("student_id", student.id)
      .eq("week_number", week_number - 1)
      .maybeSingle();

    if (!prevProg) {
      return NextResponse.json(
        { error: "Previous week must be completed first" },
        { status: 409 }
      );
    }

    // Determine whether previous week is actually complete
    const { data: prevWeek } = await supabase
      .from("mystery_school_foundation_weeks")
      .select("tasks")
      .eq("week_number", week_number - 1)
      .eq("is_published", true)
      .single();

    const prevTaskDefs: TaskDef[] = Array.isArray(prevWeek?.tasks)
      ? prevWeek.tasks
      : [];
    const prevCompletions: Record<string, TaskCompletion> =
      (prevProg.task_completions as Record<string, TaskCompletion>) ?? {};

    const prevComplete =
      prevTaskDefs.length === 0
        ? !!prevProg.week_completed_at
        : prevTaskDefs.every((t) => !!prevCompletions[t.id]);

    if (!prevComplete) {
      return NextResponse.json(
        { error: "Previous week must be completed first" },
        { status: 409 }
      );
    }
  }

  // Fetch (or create) the progress row for this week
  const { data: existingProg } = await supabase
    .from("student_foundation_progress")
    .select("id, task_completions, week_completed_at")
    .eq("student_id", student.id)
    .eq("week_number", week_number)
    .maybeSingle();

  const now = new Date().toISOString();
  const existingCompletions: Record<string, TaskCompletion> =
    (existingProg?.task_completions as Record<string, TaskCompletion>) ?? {};

  // Idempotent — already completed, return current state
  if (existingCompletions[task_id]) {
    const allDone = taskDefs.every((t) => !!existingCompletions[t.id]);
    return NextResponse.json({
      week_completed: allDone,
      q1_complete: allDone && week_number === 12,
    });
  }

  const updatedCompletions: Record<string, TaskCompletion> = {
    ...existingCompletions,
    [task_id]: { completed_at: now },
  };

  const allTasksNowDone =
    taskDefs.length > 0 && taskDefs.every((t) => !!updatedCompletions[t.id]);

  if (existingProg) {
    // Update existing row
    const updatePayload: Record<string, unknown> = {
      task_completions: updatedCompletions,
    };
    if (allTasksNowDone && !existingProg.week_completed_at) {
      updatePayload.week_completed_at = now;
      // Also keep completed_at in sync for backward compat
      updatePayload.completed_at = now;
    }
    const { error: updateError } = await supabase
      .from("student_foundation_progress")
      .update(updatePayload)
      .eq("id", existingProg.id);

    if (updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 });
  } else {
    // Insert new row
    const insertPayload: Record<string, unknown> = {
      student_id: student.id,
      week_number,
      task_completions: updatedCompletions,
    };
    if (allTasksNowDone) {
      insertPayload.week_completed_at = now;
      insertPayload.completed_at = now;
    } else {
      // completed_at column is NOT NULL with a default, but we're inserting
      // before the week is done — provide the current timestamp as a placeholder.
      insertPayload.completed_at = now;
    }
    const { error: insertError } = await supabase
      .from("student_foundation_progress")
      .insert(insertPayload);

    if (insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // If week 12 is now fully done, advance training_status to "decans"
  if (allTasksNowDone && week_number === 12 && student.training_status === "foundation") {
    await supabase
      .from("mystery_school_students")
      .update({ training_status: "decans" })
      .eq("id", student.id)
      .eq("training_status", "foundation");
  }

  return NextResponse.json({
    week_completed: allTasksNowDone,
    q1_complete: allTasksNowDone && week_number === 12,
  });
}
