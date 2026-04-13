import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/onboarding/prefill
 *
 * Returns the authenticated user's community_members row so the onboarding
 * form can pre-fill any data that was already set during provisioning
 * (e.g. name, email, phone from the signup flow).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member, error: memberErr } = await supabase
      .from("community_members")
      .select(
        "id, email, full_name, first_name, last_name, phone, gender, date_of_birth, birth_time, birth_city, state, city, zip, address, relationship_status, relation_type, intake_data, occupation, membership_status, membership_type"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberErr) {
      console.error("[onboarding/prefill] lookup error:", memberErr);
      return NextResponse.json(
        { error: "Failed to load profile." },
        { status: 500 }
      );
    }

    if (!member) {
      return NextResponse.json(
        { error: "No community membership found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  } catch (err) {
    console.error("[onboarding/prefill] error:", err);
    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 }
    );
  }
}
