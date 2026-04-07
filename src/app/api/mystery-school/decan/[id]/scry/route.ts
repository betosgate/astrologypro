import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]/scry
 * Returns existing scry journal for this student+decan, or null.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: decanId } = await params;

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  const { data: journal } = await supabase
    .from("scry_journals")
    .select(
      "id, assigned_card, alternate_card, experience_text, content, submitted_at, submission_count"
    )
    .eq("student_id", student.id)
    .eq("decan_id", decanId)
    .maybeSingle();

  return NextResponse.json(journal ?? null);
}

/**
 * POST /api/mystery-school/decan/[id]/scry
 * Body: { assigned_card: string, alternate_card?: string, experience_text: string }
 * Validates experience_text min 50 chars server-side.
 * Inserts or updates (upsert). Sets student_decan_progress.scry_done = true.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: decanId } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { assigned_card, alternate_card, experience_text } = body as {
    assigned_card?: string;
    alternate_card?: string;
    experience_text?: string;
  };

  if (!assigned_card?.trim()) {
    return NextResponse.json({ error: "assigned_card is required" }, { status: 422 });
  }
  if (!experience_text?.trim()) {
    return NextResponse.json({ error: "experience_text is required" }, { status: 422 });
  }
  if (experience_text.trim().length < 50) {
    return NextResponse.json(
      { error: "experience_text must be at least 50 characters" },
      { status: 422 }
    );
  }

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  // Check for existing entry (the table has UNIQUE(student_id, decan_id))
  const { data: existing } = await admin
    .from("scry_journals")
    .select("id, submission_count")
    .eq("student_id", student.id)
    .eq("decan_id", decanId)
    .maybeSingle();

  let upsertError: { message: string } | null = null;

  if (existing) {
    const { error } = await admin
      .from("scry_journals")
      .update({
        assigned_card: assigned_card.trim(),
        alternate_card: alternate_card?.trim() ?? null,
        experience_text: experience_text.trim(),
        // keep content in sync for backward compat
        content: experience_text.trim(),
        submission_count: (existing.submission_count ?? 1) + 1,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    upsertError = error;
  } else {
    const { error } = await admin.from("scry_journals").insert({
      student_id: student.id,
      decan_id: decanId,
      assigned_card: assigned_card.trim(),
      alternate_card: alternate_card?.trim() ?? null,
      experience_text: experience_text.trim(),
      content: experience_text.trim(),
      submission_count: 1,
    });
    upsertError = error;
  }

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Mark scry_done on progress
  await admin
    .from("student_decan_progress")
    .upsert(
      {
        student_id: student.id,
        decan_id: decanId,
        scry_done: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,decan_id" }
    );

  // Check overall completion
  const { data: progress } = await admin
    .from("student_decan_progress")
    .select("ritual_done, scry_done, journal_done, status")
    .eq("student_id", student.id)
    .eq("decan_id", decanId)
    .single();

  if (
    progress?.ritual_done &&
    progress.scry_done &&
    progress.journal_done &&
    progress.status !== "completed"
  ) {
    await admin
      .from("student_decan_progress")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("student_id", student.id)
      .eq("decan_id", decanId);
  }

  return NextResponse.json({ success: true });
}
