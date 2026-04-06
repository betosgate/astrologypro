import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/heartbeat
 * Body: { delta_seconds: number }   — seconds elapsed since last heartbeat (client sends every 30s)
 *
 * Accumulates time_spent_seconds in lesson_progress.
 * Also accumulates time in program_enrollments.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: lessonId } = await params;

  let body: { delta_seconds?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const delta = body.delta_seconds;
  if (typeof delta !== "number" || delta < 0 || delta > 120) {
    return NextResponse.json(
      { error: "delta_seconds must be a number between 0 and 120." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Update lesson_progress
  const { data: progress } = await admin
    .from("lesson_progress")
    .select("id, time_spent_seconds")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  if (progress) {
    await admin
      .from("lesson_progress")
      .update({
        last_active_at: now,
        time_spent_seconds: (progress.time_spent_seconds ?? 0) + Math.round(delta),
      })
      .eq("id", progress.id);
  }

  // Also accumulate on program_enrollments
  if (progress) {
    const { data: lesson } = await admin
      .from("training_lessons")
      .select("category_id")
      .eq("id", lessonId)
      .single();

    if (lesson?.category_id) {
      const { data: category } = await admin
        .from("training_categories")
        .select("program_id")
        .eq("id", lesson.category_id)
        .single();

      if (category?.program_id) {
        const { data: enrollment } = await admin
          .from("program_enrollments")
          .select("id, time_spent_seconds")
          .eq("user_id", user.id)
          .eq("program_id", category.program_id)
          .single();

        if (enrollment) {
          await admin
            .from("program_enrollments")
            .update({
              time_spent_seconds: (enrollment.time_spent_seconds ?? 0) + Math.round(delta),
            })
            .eq("id", enrollment.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
