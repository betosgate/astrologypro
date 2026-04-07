import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/triggers/[triggerId]/rewatch
 * Body: { current_position_seconds: number }
 *
 * Called periodically by the video player after a wrong answer rewind.
 * Marks rewatch_completed=true once the learner has watched past the
 * required position (rewind_target_seconds + 30s).
 *
 * Response: { rewatch_completed: boolean, required_until?: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; triggerId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId, triggerId } = await params;

  let body: { current_position_seconds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        type: "/errors/invalid-body",
        title: "Invalid Request Body",
        status: 400,
        detail: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  const { current_position_seconds } = body;

  if (
    typeof current_position_seconds !== "number" ||
    !Number.isFinite(current_position_seconds) ||
    current_position_seconds < 0
  ) {
    return NextResponse.json(
      {
        type: "/errors/validation",
        title: "Validation Error",
        status: 422,
        detail: "current_position_seconds must be a non-negative number.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch user's trigger progress
  const { data: progress, error: progressError } = await admin
    .from("lesson_trigger_progress")
    .select("id, rewatch_required_until_seconds, rewatch_completed, passed")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .eq("trigger_id", triggerId)
    .maybeSingle();

  if (progressError) {
    return NextResponse.json(
      {
        type: "/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch trigger progress.",
      },
      { status: 500 }
    );
  }

  // If no progress record exists or already passed, nothing to gate
  if (!progress) {
    return NextResponse.json({ rewatch_completed: true });
  }

  // Already completed
  if (progress.rewatch_completed || progress.passed) {
    return NextResponse.json({ rewatch_completed: true });
  }

  const requiredUntil = progress.rewatch_required_until_seconds ?? 0;

  if (current_position_seconds >= requiredUntil) {
    // Mark rewatch as completed
    await admin
      .from("lesson_trigger_progress")
      .update({ rewatch_completed: true })
      .eq("id", progress.id);

    return NextResponse.json({ rewatch_completed: true });
  }

  return NextResponse.json({
    rewatch_completed: false,
    required_until: requiredUntil,
  });
}
