import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNatalChart } from "@/lib/astro/natal-chart";
import { sendNatalChartReady, sendNatalChartUpdated } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/community/generate-natal
 * Body: { familyMemberId: string, changedFields?: string[] }
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
 *
 * Error taxonomy (Task 02 hardening):
 *   401 — no authenticated user
 *   403 — caller is not the owning community member (or profile is locked)
 *   404 — family_member row truly does not exist
 *   422 — required birth data is missing (date_of_birth, city, lat/lng)
 *   500 database_schema_error — natal_status/governance columns missing (run migrations)
 *   500 chart_generation_failed — astrology engine threw
 *   500 database_error         — update/insert failure
 *
 * This route never reveals another user's data in error responses —
 * foreign-member IDs return a generic 404 without leaking existence.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { familyMemberId, changedFields = [] } = body as {
    familyMemberId?: string;
    changedFields?: string[];
  };

  if (!familyMemberId) {
    return NextResponse.json(
      { error: "familyMemberId required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // ─── Step 1: Resolve the active community member for this user ──────────────
  // Done with admin client because RLS on community_members can be tight, but
  // we still scope strictly by user.id — we never accept a caller-supplied
  // member_id.
  const { data: owningMember, error: memberErr } = await admin
    .from("community_members")
    .select("id, email, full_name, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    console.error("[generate-natal] community_members lookup failed", {
      user_id: user.id,
      err: memberErr,
    });
    return NextResponse.json(
      { error: "database_error", detail: "Could not resolve your community membership" },
      { status: 500 }
    );
  }

  if (!owningMember) {
    return NextResponse.json(
      { error: "No active community membership found for this account" },
      { status: 403 }
    );
  }

  // ─── Step 2: Ownership check (simple select, no natal columns yet) ──────────
  // Isolating this select so a missing-column schema error on the natal fields
  // can't masquerade as "member not found".
  const { data: ownership, error: ownershipErr } = await admin
    .from("community_family_members")
    .select("id, member_id")
    .eq("id", familyMemberId)
    .maybeSingle();

  if (ownershipErr) {
    console.error("[generate-natal] ownership select failed", {
      family_member_id: familyMemberId,
      user_id: user.id,
      err: ownershipErr,
    });
    return NextResponse.json(
      { error: "database_error", detail: "Could not load family member record" },
      { status: 500 }
    );
  }

  if (!ownership) {
    return NextResponse.json({ error: "Family member not found" }, { status: 404 });
  }

  if (ownership.member_id !== owningMember.id) {
    // Foreign family member — return 404 (not 403) to avoid leaking existence
    // to other owners. The difference is logged server-side for debugging.
    console.warn("[generate-natal] cross-owner access attempt", {
      user_id: user.id,
      requested_family_member_id: familyMemberId,
      actual_member_id: ownership.member_id,
      caller_member_id: owningMember.id,
    });
    return NextResponse.json({ error: "Family member not found" }, { status: 404 });
  }

  // ─── Step 3: Fetch natal governance columns (separate from ownership) ───────
  // Now that ownership is proven, select the columns needed for generation.
  // A failure here specifically means the governance migration is missing —
  // we surface that clearly instead of calling it "Family member not found".
  const { data: fm, error: fmError } = await admin
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
    // We already know the row exists (ownership check above), so an error
    // here is a schema/migration problem, not a real 404.
    console.error("[generate-natal] governance select failed — missing migration?", {
      family_member_id: familyMemberId,
      user_id: user.id,
      err: fmError,
    });
    return NextResponse.json(
      {
        error: "database_schema_error",
        detail:
          "Natal chart generation columns are missing. An administrator must run the pending natal_generation_governance migration.",
      },
      { status: 500 }
    );
  }

  // ─── Step 4: Lifecycle gate ─────────────────────────────────────────────────
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

  const isFirstGeneration =
    fm.natal_status === "not_started" || fm.natal_status === "queued";
  const isUserCorrection = !isFirstGeneration;

  if (isUserCorrection) {
    const retriesRemaining = fm.natal_max_retries - fm.natal_retry_count;
    if (retriesRemaining <= 0) {
      await admin
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

  // ─── Step 5: Validate required birth data BEFORE marking queued ─────────────
  const latNum = fm.birth_lat != null ? Number(fm.birth_lat) : NaN;
  const lngNum = fm.birth_lng != null ? Number(fm.birth_lng) : NaN;

  const missing: string[] = [];
  if (!fm.date_of_birth) missing.push("date_of_birth");
  if (!fm.birth_city || !String(fm.birth_city).trim()) missing.push("birth_city");
  if (!Number.isFinite(latNum)) missing.push("birth_lat");
  if (!Number.isFinite(lngNum)) missing.push("birth_lng");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "missing_birth_data",
        detail: `Cannot generate chart — required birth fields are incomplete: ${missing.join(", ")}.`,
        missing_fields: missing,
      },
      { status: 422 }
    );
  }

  // ─── Step 6: Mark as queued ─────────────────────────────────────────────────
  await admin
    .from("community_family_members")
    .update({ natal_status: "queued" })
    .eq("id", familyMemberId);

  // ─── Step 7: Generate chart ─────────────────────────────────────────────────
  let chart;
  try {
    chart = generateNatalChart({
      dateOfBirth: fm.date_of_birth,
      birthTime: fm.birth_time ?? null,
      lat: latNum,
      lng: lngNum,
      ageGroup: (fm.age_group as "child" | "adult") ?? "adult",
    });
  } catch (genErr) {
    const failReason =
      genErr instanceof Error ? genErr.message : "generation_error";

    console.error("[generate-natal] chart generation failed", {
      family_member_id: familyMemberId,
      user_id: user.id,
      err: genErr,
    });

    await admin
      .from("community_family_members")
      .update({
        natal_status: "failed",
        natal_failure_reason: failReason,
      })
      .eq("id", familyMemberId);

    // Record the failed attempt in audit (for correction retries)
    if (isUserCorrection) {
      await admin.from("natal_regeneration_audit").insert({
        family_member_id: familyMemberId,
        initiated_by_user_id: user.id,
        retry_number: fm.natal_retry_count + 1,
        fields_changed: changedFields,
        succeeded: false,
        failure_reason: failReason,
      });

      // Consume the retry count even on failure so user cannot bypass limit
      // via repeated failures
      await admin
        .from("community_family_members")
        .update({ natal_retry_count: fm.natal_retry_count + 1 })
        .eq("id", familyMemberId);
    }

    return NextResponse.json(
      { error: "chart_generation_failed", detail: failReason },
      { status: 500 }
    );
  }

  // ─── Step 8: Persist chart + update governance fields ───────────────────────
  const now = new Date().toISOString();
  const newRetryCount = isUserCorrection
    ? fm.natal_retry_count + 1
    : fm.natal_retry_count;
  const willLock = isUserCorrection && newRetryCount >= fm.natal_max_retries;

  const { error: updateError } = await admin
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
    console.error("[generate-natal] chart persist failed", {
      family_member_id: familyMemberId,
      user_id: user.id,
      err: updateError,
    });
    return NextResponse.json(
      { error: "database_error", detail: updateError.message },
      { status: 500 }
    );
  }

  // ─── Step 9: Audit record for user-initiated corrections ────────────────────
  if (isUserCorrection) {
    await admin.from("natal_regeneration_audit").insert({
      family_member_id: familyMemberId,
      initiated_by_user_id: user.id,
      retry_number: newRetryCount,
      fields_changed: changedFields,
      succeeded: true,
    });
  }

  // ─── Step 10: Email notification — tracked independently ────────────────────
  try {
    if (owningMember.email) {
      if (isFirstGeneration) {
        await sendNatalChartReady({
          to: owningMember.email,
          name: owningMember.full_name ?? "Member",
          familyMemberName: fm.full_name,
          chartUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/community/family`,
        });
      } else {
        await sendNatalChartUpdated({
          to: owningMember.email,
          name: owningMember.full_name ?? "Member",
          familyMemberName: fm.full_name,
          retriesUsed: newRetryCount,
          retriesAllowed: fm.natal_max_retries,
          chartUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/community/family`,
        });
      }
    }
  } catch (emailErr) {
    // Notification failure is non-blocking — chart was saved successfully
    console.error(
      "[generate-natal] email notification failed for",
      familyMemberId,
      emailErr
    );
  }

  return NextResponse.json({
    chart,
    natal_status: willLock ? "locked_for_review" : "generated",
    retries_used: newRetryCount,
    retries_remaining: fm.natal_max_retries - newRetryCount,
    is_first_generation: isFirstGeneration,
  });
}
