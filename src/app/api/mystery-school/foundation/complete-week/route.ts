import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/mystery-school/foundation/complete-week
 * Marks a foundation week as complete for the authenticated student.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekNumber } = await req.json();
  if (!weekNumber || typeof weekNumber !== "number" || weekNumber < 1 || weekNumber > 12) {
    return NextResponse.json({ error: "weekNumber must be 1-12" }, { status: 400 });
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
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  // Check week is unlocked (previous week must be complete, or week 1)
  if (weekNumber > 1) {
    const { count } = await supabase
      .from("student_foundation_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("week_number", weekNumber - 1);

    if ((count ?? 0) === 0) {
      return NextResponse.json({ error: "Previous week must be completed first" }, { status: 409 });
    }
  }

  // Upsert (idempotent)
  const { error } = await supabase
    .from("student_foundation_progress")
    .upsert(
      { student_id: student.id, week_number: weekNumber },
      { onConflict: "student_id,week_number" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If all 12 weeks complete, update training_status to "decans"
  const { count: doneCount } = await supabase
    .from("student_foundation_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id);

  if ((doneCount ?? 0) >= 12) {
    await supabase
      .from("mystery_school_students")
      .update({ training_status: "decans" })
      .eq("id", student.id)
      .is("training_status", null) // only advance if still in foundation
      .neq("training_status", "decans");

    // Clear the eq/neq approach — just update if still foundation
    await supabase
      .from("mystery_school_students")
      .update({ training_status: "decans" })
      .eq("id", student.id)
      .eq("training_status", "foundation");
  }

  return NextResponse.json({ success: true, weekNumber });
}
