import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/foundation
 * Returns all 12 foundation weeks with the student's completion status.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify active mystery school membership
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_type !== "mystery_school" || member.membership_status !== "active") {
    return NextResponse.json({ error: "Mystery School membership required" }, { status: 403 });
  }

  // Get student record
  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id, training_status, enrolled_at, start_quarter")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  // Get published weeks
  const { data: weeks, error: weeksError } = await supabase
    .from("mystery_school_foundation_weeks")
    .select("id, week_number, title, content, audio_url, beto_photo_url")
    .eq("is_published", true)
    .order("week_number");

  if (weeksError) return NextResponse.json({ error: weeksError.message }, { status: 500 });

  // Get student progress
  const { data: progress } = await supabase
    .from("student_foundation_progress")
    .select("week_number, completed_at")
    .eq("student_id", student.id);

  const completedWeeks = new Set((progress ?? []).map((p) => p.week_number));

  // Determine unlock status — week unlocks if previous week is done (or week 1 always)
  const weeksWithStatus = (weeks ?? []).map((week, index) => ({
    ...week,
    completed: completedWeeks.has(week.week_number),
    unlocked: index === 0 || completedWeeks.has(week.week_number - 1),
    completedAt: progress?.find((p) => p.week_number === week.week_number)?.completed_at ?? null,
  }));

  return NextResponse.json({
    student: {
      id: student.id,
      trainingStatus: student.training_status,
      enrolledAt: student.enrolled_at,
      startQuarter: student.start_quarter,
    },
    weeks: weeksWithStatus,
    totalWeeks: 12,
    completedCount: completedWeeks.size,
  });
}
