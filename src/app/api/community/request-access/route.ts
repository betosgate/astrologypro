import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, membershipType } = await req.json();

    if (!email || !membershipType) {
      return NextResponse.json({ error: "Email and membership type are required" }, { status: 400 });
    }

    if (!["perennial_mandalism", "mystery_school"].includes(membershipType)) {
      return NextResponse.json({ error: "Invalid membership type" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if already a member
    const { data: existing } = await admin
      .from("community_members")
      .select("id, membership_status")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (existing.membership_status === "active") {
        return NextResponse.json({ error: "This email already has an active membership. Please sign in." }, { status: 409 });
      }
    }

    // Send a magic link — on click, auth/callback will route to /community
    // We store the request so admins can review it; the magic link grants access on approval
    // For now: send OTP magic link directly (admin-approved flow can be layered later)
    const { error: otpError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${APP_URL}/auth/callback?next=/community`,
        data: { role: membershipType, pending_membership: membershipType },
      },
    });

    if (otpError) {
      console.error("community request-access OTP error:", otpError.message);
      return NextResponse.json({ error: "Failed to send access link. Please try again." }, { status: 500 });
    }

    // The actual community_members row is created when the user first logs in via the magic link.
    // We don't insert here because user_id is unknown until they click through.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("community request-access error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
