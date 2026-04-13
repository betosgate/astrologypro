import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNatalChart } from "@/lib/astro/natal-chart";
import { sendNatalChartReady, sendNatalChartUpdated } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/community/generate-natal
 * Body: { familyMemberId: string }
 *
 * Governs natal chart generation with lifecycle state, retry limit enforcement,
 * and regeneration audit tracking.
 *
 * Rules:
 * - First-time generation is automatic and does NOT count against the retry limit.
 * - Users may initiate up to natal_max_retries (default 3) correction regenerations.
 * - When the limit is exhausted the profile is locked — user must open a support ticket.
 * - Every regeneration attempt is recorded in natal_regeneration_audit.
 * - On success, sends a natal-ready or natal-updated email notification.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { familyMemberId, changedFields = [] } = body as {
    familyMemberId: string;
    changedFields?: string[];
  };

  if (!familyMemberId) {
    return NextResponse.json({ error: "familyMemberId required" }, { status: 400 });
  }

  // Fetch the family member — RLS ensures the authenticated user owns this record
  const { data: fm, error: fmError } = await supabase
    .from("community_family_members")
    .select(
      `id, full_name, date_of_birth, birth_time, birth_city, birth_country,
       birth_lat, birth_lng, age_group, member_id,
       natal_status, natal_retry_count, natal_max_retries,
       natal_first_generated_at, natal_last_generated_at`
    )
    .eq("id", familyMemberId)
    .single();

  if (fmError || !fm) {
    return NextResponse.json({ error: "Family member not found" }, { status: 404 });
  }

  // ── Lifecycle gate ────────────────────────────────────────────────────────
  if (fm.natal_status === "locked_for_review") {
    return NextResponse.json(
      {
        error: "Correction retry limit reached. Please open a support ticket for this profile.",
        natal_status: "locked_for_review",
        retries_used: fm.natal_retry_count,
        retries_allowed: fm.natal_max_retries,
      },
      { status: 403 }
    );
  }

  const isFirstGeneration = fm.natal_status === "not_started" || fm.natal_status === "queued";
  const isUserCorrection = !isFirstGeneration; // any subsequent regeneration uses a retry

  // Check retry limit before attempting a correction regeneration
  if (isUserCorrection) {
    const retriesRemaining = fm.natal_max_retries - fm.natal_retry_count;
    if (retriesRemaining <= 0) {
      // Lock the profile so future calls get the locked gate above
      await supabase
        .from("community_family_members")
        .update({
          natal_status: "locked_for_review",
          natal_lock_reason: "max_correction_retries_exhausted",
        })
        .eq("id", familyMemberId);

      return NextResponse.json(
        {
          error: "Correction retry limit reached. Please open a support ticket for this profile.",
          natal_status: "locked_for_review",
          retries_used: fm.natal_retry_count,
          retries_allowed: fm.natal_max_retries,
        },
        { status: 403 }
      );
    }
  }

  // ── Mark as queued while generating ──────────────────────────────────────
  await supabase
    .from("community_family_members")
    .update({ natal_status: "queued" })
    .eq("id", familyMemberId);

  // ── Generate chart ────────────────────────────────────────────────────────
  const lat = Number(fm.birth_lat ?? 0);
  const lng = Number(fm.birth_lng ?? 0);

  let chart;
  try {
    chart = generateNatalChart({
      dateOfBirth: fm.date_of_birth,
      birthTime: fm.birth_time ?? null,
      lat,
      lng,
      ageGroup: (fm.age_group as "child" | "adult") ?? "adult",
    });
  } catch (genErr) {
    const failReason = genErr instanceof Error ? genErr.message : "generation_error";

    await supabase
      .from("community_family_members")
      .update({
        natal_status: "failed",
        natal_failure_reason: failReason,
      })
      .eq("id", familyMemberId);

    // Record the failed attempt in audit (for correction retries)
    if (isUserCorrection) {
      const admin = createAdminClient();
      await admin.from("natal_regeneration_audit").insert({
        family_member_id: familyMemberId,
        initiated_by_user_id: user.id,
        retry_number: fm.natal_retry_count + 1,
        fields_changed: changedFields,
        succeeded: false,
        failure_reason: failReason,
      });

      // Consume the retry count even on failure so user cannot bypass limit via repeated failures
      await supabase
        .from("community_family_members")
        .update({ natal_retry_count: fm.natal_retry_count + 1 })
        .eq("id", familyMemberId);
    }

    return NextResponse.json({ error: failReason }, { status: 500 });
  }

  // ── Persist chart + update governance fields ──────────────────────────────
  const now = new Date().toISOString();
  const newRetryCount = isUserCorrection ? fm.natal_retry_count + 1 : fm.natal_retry_count;
  const willLock = isUserCorrection && newRetryCount >= fm.natal_max_retries;

  const { error: updateError } = await supabase
    .from("community_family_members")
    .update({
      natal_chart: chart,
      chart_updated_at: now,
      natal_status: willLock ? "locked_for_review" : "generated",
      natal_retry_count: newRetryCount,
      natal_first_generated_at: fm.natal_first_generated_at ?? now,
      natal_last_generated_at: now,
      natal_failure_reason: null,
      natal_lock_reason: willLock ? "max_correction_retries_exhausted" : null,
    })
    .eq("id", familyMemberId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // ── Audit record for user-initiated corrections ───────────────────────────
  if (isUserCorrection) {
    const admin = createAdminClient();
    await admin.from("natal_regeneration_audit").insert({
      family_member_id: familyMemberId,
      initiated_by_user_id: user.id,
      retry_number: newRetryCount,
      fields_changed: changedFields,
      succeeded: true,
    });
  }

  // ── Email notification — tracked independently ────────────────────────────
  try {
    // Fetch the owning member's email for notification
    const { data: member } = await supabase
      .from("community_members")
      .select("email, full_name")
      .eq("id", fm.member_id)
      .single();

    if (member?.email) {
      if (isFirstGeneration) {
        await sendNatalChartReady({
          to: member.email,
          name: member.full_name ?? "Member",
          familyMemberName: fm.full_name,
          chartUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/community/family`,
        });
      } else {
        await sendNatalChartUpdated({
          to: member.email,
          name: member.full_name ?? "Member",
          familyMemberName: fm.full_name,
          retriesUsed: newRetryCount,
          retriesAllowed: fm.natal_max_retries,
          chartUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/community/family`,
        });
      }
    }
  } catch (emailErr) {
    // Notification failure is non-blocking — chart was saved successfully
    console.error("[generate-natal] email notification failed for", familyMemberId, emailErr);
  }

  return NextResponse.json({
    chart,
    natal_status: willLock ? "locked_for_review" : "generated",
    retries_used: newRetryCount,
    retries_remaining: fm.natal_max_retries - newRetryCount,
    is_first_generation: isFirstGeneration,
  });
}
