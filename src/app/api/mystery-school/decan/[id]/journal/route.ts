import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: decanId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("mundane_journals")
    .insert({ student_id: student.id, decan_id: decanId, content });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark journal_done on progress
  await admin
    .from("student_decan_progress")
    .upsert(
      { student_id: student.id, decan_id: decanId, journal_done: true, updated_at: new Date().toISOString() },
      { onConflict: "student_id,decan_id" }
    );

  // Check overall completion
  const { data: p } = await admin
    .from("student_decan_progress")
    .select("ritual_done, scry_done, journal_done, status")
    .eq("student_id", student.id)
    .eq("decan_id", decanId)
    .single();

  if (p?.ritual_done && p.scry_done && p.journal_done && p.status !== "completed") {
    await admin
      .from("student_decan_progress")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("student_id", student.id)
      .eq("decan_id", decanId);
  }

  return NextResponse.json({ success: true });
}
