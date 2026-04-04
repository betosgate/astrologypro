import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/trainees/validate-invite?code=MENTOR-ABC123
// Returns { valid: true, divinerId: "uuid" } or 404
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Diviner invite codes are stored in diviners.trainee_invite_code
  // Fall back to checking diviners.username-based codes if column doesn't exist
  const { data: diviner, error } = await admin
    .from("diviners")
    .select("id, display_name, trainee_invite_code")
    .eq("trainee_invite_code", code)
    .maybeSingle();

  if (error) {
    // Column may not exist yet — treat as invalid
    console.warn("validate-invite query error:", error.message);
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (!diviner) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  return NextResponse.json({ valid: true, divinerId: diviner.id, mentorName: diviner.display_name });
}
