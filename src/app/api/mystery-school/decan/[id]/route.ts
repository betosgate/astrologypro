import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]
 * Returns a single decan with ritual steps, student progress, and journals.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_type !== "mystery_school" || member.membership_status !== "active") {
    return NextResponse.json({ error: "Mystery School membership required" }, { status: 403 });
  }

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  const [decanRes, ritualsRes, progressRes, scryRes, journalRes] = await Promise.all([
    supabase
      .from("decans")
      .select("id, decan_number, sign, planet, title, start_month, start_day, end_month, end_day, description")
      .eq("id", id)
      .single(),
    supabase
      .from("decan_rituals")
      .select("id, step_order, step_type, content")
      .eq("decan_id", id)
      .order("step_order"),
    supabase
      .from("student_decan_progress")
      .select("status, ritual_done, scry_done, journal_done, unlocked_at, completed_at")
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .single(),
    supabase
      .from("scry_journals")
      .select("content, submitted_at")
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .single(),
    supabase
      .from("mundane_journals")
      .select("content, submitted_at")
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .single(),
  ]);

  if (!decanRes.data) return NextResponse.json({ error: "Decan not found" }, { status: 404 });

  return NextResponse.json({
    decan: decanRes.data,
    ritualSteps: ritualsRes.data ?? [],
    progress: progressRes.data ?? null,
    scryJournal: scryRes.data ?? null,
    mundaneJournal: journalRes.data ?? null,
    studentId: student.id,
  });
}
