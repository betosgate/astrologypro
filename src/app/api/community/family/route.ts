import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFamilyMemberInvite } from "@/lib/email";
import {
  resolveEntitlementFromRow,
  type PmEntitlement,
} from "@/lib/community/pm-entitlement";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * Safe ceiling when we can't resolve any tier AND the member's legacy
 * `plan_type` says family. Matches the historical FAMILY_PLAN_LIMIT.
 */
const LEGACY_FALLBACK_FAMILY_LIMIT = 5;

async function getMemberAndEntitlement() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, member: null, entitlement: null, supabase };
  }

  // Canonical resolver needs service-role access so RLS doesn't hide the
  // tier row from a regular user. The `community_members` row itself is
  // readable by the owner via the auth-scoped client.
  const admin = createAdminClient();

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status, pm_tier_id, plan_type")
    .eq("user_id", user.id)
    .single();

  if (!member) return { user, member: null, entitlement: null, supabase };

  const entitlement = await resolveEntitlementFromRow(admin, {
    pm_tier_id: (member.pm_tier_id as string | null) ?? null,
    plan_type: (member.plan_type as string | null) ?? null,
  });

  if (entitlement.hasDrift) {
    console.warn(
      `[community/family] entitlement drift on member ${member.id}: tier='${entitlement.tier?.name}' (canonical=${entitlement.planTypeCanonical}) vs legacy plan_type=${entitlement.planTypeLegacy}`
    );
  }

  return { user, member, entitlement, supabase };
}

function buildFamilyPayload(
  members: unknown[],
  entitlement: PmEntitlement,
) {
  const maxMembers =
    entitlement.tier?.max_total_members ??
    (entitlement.isFamilyEntitled ? LEGACY_FALLBACK_FAMILY_LIMIT : 1);

  return {
    members,
    // Legacy field — older consumers read `planType` directly. Returning the
    // canonical derivation keeps UIs that didn't migrate correct.
    planType: entitlement.planTypeCanonical,
    // Canonical fields — new consumers should use these.
    entitlement: {
      isFamilyEntitled: entitlement.isFamilyEntitled,
      tierId: entitlement.tier?.id ?? null,
      tierName: entitlement.tier?.name ?? null,
      maxMembers,
      // True when the row is out-of-sync (Task 04 backfill target).
      hasLegacyDrift: entitlement.hasDrift,
    },
  };
}

/**
 * GET /api/community/family
 * Returns all family members for the authenticated community member AND
 * canonical entitlement state (is_family_entitled, max_members, tier).
 */
export async function GET() {
  const { member, entitlement, supabase } = await getMemberAndEntitlement();
  if (!member || !entitlement) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (member.membership_status !== "active") {
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, relationship, age_group, natal_chart, natal_status, natal_report_id, natal_report_status, natal_report_generated_at, natal_last_generated_at, chart_updated_at, notes, created_at, updated_at"
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(buildFamilyPayload(data ?? [], entitlement));
}

/**
 * POST /api/community/family
 * Add a family member. Rejects non-Family-entitled members with 403 —
 * this is the server-side gate the UI currently only hides with CSS.
 */
export async function POST(request: NextRequest) {
  const { member, entitlement, supabase } = await getMemberAndEntitlement();
  if (!member || !entitlement) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (member.membership_status !== "active") {
    return NextResponse.json({ error: "Inactive membership" }, { status: 403 });
  }

  // ── Canonical entitlement gate ──────────────────────────────────────────
  // UI hiding the "Add member" button is not security — the POST must also
  // refuse non-Family users. Audit note §5 risk #6.
  if (!entitlement.isFamilyEntitled) {
    return NextResponse.json(
      {
        error:
          "Your current plan does not include family members. Upgrade to a Family plan to add household members.",
        code: "not_family_entitled",
      },
      { status: 403 }
    );
  }

  // ── Household-size ceiling ──────────────────────────────────────────────
  // Prefer the tier's max_total_members (includes the primary, so subtract 1
  // for family-only headcount). Fall back to the legacy constant only when
  // no tier is resolved.
  const tierMaxTotal = entitlement.tier?.max_total_members ?? null;
  const familyOnlyLimit =
    tierMaxTotal != null
      ? Math.max(0, tierMaxTotal - 1) // subtract the primary
      : LEGACY_FALLBACK_FAMILY_LIMIT;

  const { count } = await supabase
    .from("community_family_members")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id);

  if ((count ?? 0) >= familyOnlyLimit) {
    return NextResponse.json(
      {
        error: `Your plan allows up to ${familyOnlyLimit} family member${familyOnlyLimit === 1 ? "" : "s"}.`,
      },
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
    birthLat,
    birthLng,
    relationship,
    notes,
    inviteEmail, // Task 10: optional — if provided, auto-send household invite
  } = body as {
    fullName?: string;
    dateOfBirth?: string;
    birthTime?: string;
    birthCity?: string;
    birthCountry?: string;
    birthLat?: number | string | null;
    birthLng?: number | string | null;
    relationship?: string;
    notes?: string;
    inviteEmail?: string;
  };

  if (!fullName || !dateOfBirth) {
    return NextResponse.json(
      { error: "fullName and dateOfBirth are required" },
      { status: 400 }
    );
  }

  // Coerce lat/lng — accept numbers or numeric strings; null if missing/invalid.
  const lat =
    birthLat == null || birthLat === ""
      ? null
      : Number.isFinite(Number(birthLat))
      ? Number(birthLat)
      : null;
  const lng =
    birthLng == null || birthLng === ""
      ? null
      : Number.isFinite(Number(birthLng))
      ? Number(birthLng)
      : null;

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
      birth_lat: lat,
      birth_lng: lng,
      relationship: relationship || null,
      notes: notes || null,
      age_group: ageGroup,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Task 10: auto-send household signup invite if an email was supplied at creation time.
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
