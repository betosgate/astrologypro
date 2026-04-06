import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendFamilyMemberInvite } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/community/family/:id/invite
 *
 * Generates a unique invite token, persists it on the family member row,
 * and sends an invite email to the specified address.
 *
 * Auth: the requesting user must own the family member via community_members.user_id.
 *
 * Body: { email: string }
 * Response: { success: true }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: familyMemberId } = await params;

    // Validate body
    const body = await request.json();
    const email = (body?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 422 }
      );
    }

    // Resolve the community_members row for this user
    const { data: member, error: memberError } = await supabase
      .from("community_members")
      .select("id, membership_status")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (member.membership_status !== "active") {
      return NextResponse.json(
        { error: "Membership is not active" },
        { status: 403 }
      );
    }

    // Verify the family member belongs to this community member (object-level auth)
    const { data: familyMember, error: fmError } = await supabase
      .from("community_family_members")
      .select("id, full_name, invite_accepted_at, user_id")
      .eq("id", familyMemberId)
      .eq("member_id", member.id)
      .single();

    if (fmError || !familyMember) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // If the member has already accepted the invite, don't re-send
    if (familyMember.user_id && familyMember.invite_accepted_at) {
      return NextResponse.json(
        { error: "This family member has already activated their login" },
        { status: 422 }
      );
    }

    // Generate a secure invite token
    const inviteToken = crypto.randomUUID();
    const now = new Date().toISOString();

    // Persist invite fields
    const { error: updateError } = await supabase
      .from("community_family_members")
      .update({
        invite_email: email,
        invite_token: inviteToken,
        invite_sent_at: now,
        updated_at: now,
      })
      .eq("id", familyMemberId)
      .eq("member_id", member.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Get inviter's display name from auth metadata
    const inviterName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.email ?? "A family member");

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

    const inviteUrl = `${appUrl}/join/family-invite?token=${inviteToken}`;

    // Send invite email (non-blocking failure — don't fail the request if SES is down)
    try {
      await sendFamilyMemberInvite({
        to: email,
        inviterName,
        familyMemberName: familyMember.full_name,
        inviteUrl,
      });
    } catch (emailErr) {
      console.error("[family/invite] Email send failed:", emailErr);
      // Token is already saved — they can retry
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[family/invite] POST error:", err);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
