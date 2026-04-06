import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/start
 * Records (or re-records) the moment a trainee opens a lesson.
 * Idempotent — if a row already exists, updates last_active_at only.
 * Also upserts program_enrollments.started_at if not set.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: lessonId } = await params;
  const admin = createAdminClient();

  // Verify lesson exists
  const { data: lesson, error: lessonErr } = await admin
    .from("training_lessons")
    .select("id, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (lessonErr || !lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Upsert lesson_progress — sets started_at on first call, updates last_active_at on subsequent
  const { data: existing } = await admin
    .from("lesson_progress")
    .select("id, started_at")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  if (existing) {
    await admin
      .from("lesson_progress")
      .update({ last_active_at: now })
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
  } else {
    await admin.from("lesson_progress").insert({
      user_id: user.id,
      lesson_id: lessonId,
      started_at: now,
      last_active_at: now,
    });
  }

  // Also record program enrollment start if this is the first lesson of the program
  if (lesson.category_id) {
    const { data: category } = await admin
      .from("training_categories")
      .select("program_id")
      .eq("id", lesson.category_id)
      .single();

    if (category?.program_id) {
      const { data: enrollment } = await admin
        .from("program_enrollments")
        .select("id, started_at")
        .eq("user_id", user.id)
        .eq("program_id", category.program_id)
        .single();

      if (enrollment && !enrollment.started_at) {
        await admin
          .from("program_enrollments")
          .update({ started_at: now })
          .eq("id", enrollment.id);
      } else if (!enrollment) {
        await admin.from("program_enrollments").insert({
          user_id: user.id,
          program_id: category.program_id,
          enrolled_at: now,
          started_at: now,
        });
      }
    }
  }

  return NextResponse.json({ started: true });
}
