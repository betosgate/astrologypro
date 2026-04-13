import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendFamilyMemberInvite } from "@/lib/email";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

const FAMILY_PLAN_LIMIT = 5;

async function getMember(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, member: null };

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status, plan_type")
    .eq("user_id", user.id)
    .single();

  return { user, member };
}

/**
 * GET /api/community/family
 * Returns all family members for the authenticated community member.
 */
export async function GET() {
  const supabase = await createClient();
  const { member } = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  const { data, error } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, relationship, age_group, natal_chart, chart_updated_at, notes, created_at, updated_at"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [], planType: member.plan_type });
}

/**
 * POST /api/community/family
 * Add a family member. Family plan: max 5 members.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { member } = await getMember(supabase);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.membership_status !== "active")
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });

  // Enforce limit
  const { count } = await supabase
    .from("community_family_members")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id);

  if ((count ?? 0) >= FAMILY_PLAN_LIMIT) {
    return NextResponse.json(
      { error: `Family plan allows up to ${FAMILY_PLAN_LIMIT} members` },
      { status: 422 }
    );
  }

  const body = await request.json();
  const {
    fullName,
    dateOfBirth,
    birthTime,
    birthCity,
    birthCountry,
    relationship,
    notes,
    inviteEmail, // Task 10: optional — if provided, auto-send household invite
  } = body;

  if (!fullName || !dateOfBirth) {
    return NextResponse.json(
      { error: "fullName and dateOfBirth are required" },
      { status: 400 }
    );
  }

  // Determine age group
  const dob = new Date(dateOfBirth);
  const ageYears =
    (new Date().getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
  const ageGroup = ageYears < 14 ? "child" : "adult";

  const { data, error } = await supabase
    .from("community_family_members")
    .insert({
      member_id: member.id,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      birth_time: birthTime || null,
      birth_city: birthCity || null,
      birth_country: birthCountry || null,
      relationship: relationship || null,
      notes: notes || null,
      age_group: ageGroup,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Task 10: auto-send household signup invite if an email was supplied at creation time.
  // The invite is automatic — the primary user does not need to press a separate "send invite" button.
  const normalizedInviteEmail = inviteEmail?.trim().toLowerCase();
  if (data && normalizedInviteEmail && normalizedInviteEmail.includes("@")) {
    const inviteToken = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inviterName =
      ((await supabase.auth.getUser()).data.user?.user_metadata?.full_name as string | undefined) ??
      normalizedInviteEmail;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
    const inviteUrl = `${appUrl}/join/family-invite?token=${inviteToken}`;

    // Persist invite fields and initial status before sending
    await supabase
      .from("community_family_members")
      .update({
        invite_email: normalizedInviteEmail,
        invite_token: inviteToken,
        invite_sent_at: now.toISOString(),
        invite_expires_at: expiresAt,
        invite_status: "sent",
        invite_resend_count: 0,
        updated_at: now.toISOString(),
      })
      .eq("id", data.id);

    try {
      await sendFamilyMemberInvite({
        to: normalizedInviteEmail,
        inviterName,
        familyMemberName: fullName,
        inviteUrl,
      });
    } catch (emailErr) {
      // Email failure is non-blocking — token is already saved so resend is possible
      console.error("[family/POST] invite email failed for", data.id, emailErr);
      await supabase
        .from("community_family_members")
        .update({
          invite_status: "failed",
          invite_failure_reason: emailErr instanceof Error ? emailErr.message : "email_send_failed",
        })
        .eq("id", data.id);
    }
  }

  return NextResponse.json({ member: data }, { status: 201 });
}
