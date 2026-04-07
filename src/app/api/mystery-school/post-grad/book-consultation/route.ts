import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/mystery-school/post-grad/book-consultation
 *
 * Marks the post-graduation consultation as booked for the authenticated
 * graduated student. This stops the post-grad reminder email sequence.
 *
 * Idempotent — calling it multiple times is safe.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401, detail: "Authentication required." },
      { status: 401 }
    );
  }

  // Fetch graduated student record
  const { data: student, error: studentError } = await supabase
    .from("mystery_school_students")
    .select("id, training_status, graduated_at, post_grad_consultation_booked_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentError) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal Server Error", status: 500, detail: studentError.message },
      { status: 500 }
    );
  }

  if (!student) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/not-found", title: "Not Found", status: 404, detail: "Student record not found." },
      { status: 404 }
    );
  }

  if (student.training_status !== "graduated" || !student.graduated_at) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/forbidden", title: "Forbidden", status: 403, detail: "Post-graduation consultation is only available to graduated students." },
      { status: 403 }
    );
  }

  // Idempotent: already booked
  if (student.post_grad_consultation_booked_at) {
    return NextResponse.json({
      success: true,
      already_booked: true,
      booked_at: student.post_grad_consultation_booked_at,
    });
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("mystery_school_students")
    .update({ post_grad_consultation_booked_at: now })
    .eq("id", student.id);

  if (updateError) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal Server Error", status: 500, detail: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, booked_at: now });
}
