import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SECTION_MIN_CHARS = 100;

/**
 * GET /api/mystery-school/decan/[id]/journal
 * Returns existing mundane journal for this student+decan, or null.
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
    .from("mundane_journals")
    .select(
      "id, relationships_section, business_work_section, shifts_perception_section, content, submitted_at"
    )
    .eq("student_id", student.id)
    .eq("decan_id", decanId)
    .maybeSingle();

  return NextResponse.json(journal ?? null);
}

/**
 * POST /api/mystery-school/decan/[id]/journal
 * Body: { relationships_section, business_work_section, shifts_perception_section }
 * All 3 sections required, min 100 chars each.
 * Inserts on first submission (409 if duplicate — one per decan).
 * Sets student_decan_progress.journal_done = true.
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

  const { relationships_section, business_work_section, shifts_perception_section } =
    body as {
      relationships_section?: string;
      business_work_section?: string;
      shifts_perception_section?: string;
    };

  // Server-side validation: all three required, min chars each
  const validationErrors: string[] = [];

  if (!relationships_section?.trim()) {
    validationErrors.push("relationships_section is required");
  } else if (relationships_section.trim().length < SECTION_MIN_CHARS) {
    validationErrors.push(
      `relationships_section must be at least ${SECTION_MIN_CHARS} characters`
    );
  }

  if (!business_work_section?.trim()) {
    validationErrors.push("business_work_section is required");
  } else if (business_work_section.trim().length < SECTION_MIN_CHARS) {
    validationErrors.push(
      `business_work_section must be at least ${SECTION_MIN_CHARS} characters`
    );
  }

  if (!shifts_perception_section?.trim()) {
    validationErrors.push("shifts_perception_section is required");
  } else if (shifts_perception_section.trim().length < SECTION_MIN_CHARS) {
    validationErrors.push(
      `shifts_perception_section must be at least ${SECTION_MIN_CHARS} characters`
    );
  }

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors.join("; ") }, { status: 422 });
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
  const combinedContent = [
    `Relationships & Personal Connections:\n${relationships_section!.trim()}`,
    `Business & Work:\n${business_work_section!.trim()}`,
    `Shifts in Perception:\n${shifts_perception_section!.trim()}`,
  ].join("\n\n");

  const { error } = await admin.from("mundane_journals").insert({
    student_id: student.id,
    decan_id: decanId,
    relationships_section: relationships_section!.trim(),
    business_work_section: business_work_section!.trim(),
    shifts_perception_section: shifts_perception_section!.trim(),
    // content for backward compat
    content: combinedContent,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark journal_done on progress
  await admin
    .from("student_decan_progress")
    .upsert(
      {
        student_id: student.id,
        decan_id: decanId,
        journal_done: true,
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
