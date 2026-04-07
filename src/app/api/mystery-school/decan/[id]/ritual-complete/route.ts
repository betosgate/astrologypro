import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMysterySchoolGraduation } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/mystery-school/decan/[id]/ritual-complete
 * Marks the ritual as done for this decan. Checks overall completion.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: decanId } = await params;

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  const admin = createAdminClient();

  // Upsert progress row, set ritual_done = true
  const { data: updated, error } = await admin
    .from("student_decan_progress")
    .upsert(
      {
        student_id: student.id,
        decan_id: decanId,
        ritual_done: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,decan_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if all three components done → mark completed
  await checkAndCompleteDecan(admin, student.id, decanId, updated, user.email ?? "");

  return NextResponse.json({ success: true });
}

async function checkAndCompleteDecan(
  admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  studentId: string,
  decanId: string,
  current: { ritual_done: boolean; scry_done: boolean; journal_done: boolean; status: string },
  userEmail: string
) {
  if (current.ritual_done && current.scry_done && current.journal_done && current.status !== "completed") {
    await admin
      .from("student_decan_progress")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("student_id", studentId)
      .eq("decan_id", decanId);

    // Check for Mystery School graduation (all 36 decans)
    const { count } = await admin
      .from("student_decan_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("status", "completed");

    if ((count ?? 0) >= 36) {
      const { data: studentRow } = await admin
        .from("mystery_school_students")
        .update({ training_status: "graduated", graduated_at: new Date().toISOString() })
        .eq("id", studentId)
        .neq("training_status", "graduated")
        .select("id")
        .single();

      if (studentRow) {
        // Fire graduation email — do not await so it doesn't block the response
        sendMysterySchoolGraduation({
          to: userEmail,
          name: userEmail.split("@")[0],
        }).catch((err) => console.error("[graduation-email]", err));
      }
    }
  }
}
