/**
 * provisionNatalReadiness
 *
 * Called when a base Perennial Mandalism user is created (via Stripe checkout
 * or auth callback). Ensures the primary user has a "self" family member record
 * that is either queued for natal generation (birth data present) or awaiting
 * input (birth data not yet captured).
 *
 * What this does:
 *   1. Checks if a "Self" family member record already exists for this member.
 *   2. If not, creates one with natal_status = 'queued' (birth data complete)
 *      or 'not_started' (birth data absent).
 *
 * What this does NOT do:
 *   - Does NOT trigger relationship chart generation (no family context yet).
 *   - Does NOT generate the natal chart inline (avoids blocking the webhook).
 *     The chart is generated when the user visits /community/family and presses
 *     "Generate Chart", or a future background worker picks up 'queued' rows.
 *   - Does NOT provision a monthly transit immediately; the monthly cron picks
 *     up the profile on its next run once a natal chart exists.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface ProvisionNatalReadinessArgs {
  admin: SupabaseClient;
  communityMemberId: string;
  // Optional birth data from user metadata (captured at signup if available)
  birthData?: {
    fullName?: string | null;
    dateOfBirth?: string | null;  // ISO date string YYYY-MM-DD
    birthTime?: string | null;    // HH:MM
    birthCity?: string | null;
    birthCountry?: string | null;
  };
}

export async function provisionNatalReadiness({
  admin,
  communityMemberId,
  birthData,
}: ProvisionNatalReadinessArgs): Promise<void> {
  try {
    // Guard: only provision for active Perennial Mandalism members
    const { data: member } = await admin
      .from("community_members")
      .select("id, full_name, membership_type, membership_status")
      .eq("id", communityMemberId)
      .single();

    if (!member || member.membership_type !== "perennial_mandalism") return;
    if (member.membership_status !== "active") return;

    // Check if a "Self" profile already exists to avoid creating duplicates
    const { data: existing } = await admin
      .from("community_family_members")
      .select("id, natal_status")
      .eq("member_id", communityMemberId)
      .eq("relationship", "Self")
      .maybeSingle();

    if (existing) {
      // Profile already provisioned — if it's in not_started and we now have
      // birth data, upgrade it to queued
      if (
        existing.natal_status === "not_started" &&
        birthData?.dateOfBirth
      ) {
        await admin
          .from("community_family_members")
          .update({ natal_status: "queued" })
          .eq("id", existing.id);
      }
      return;
    }

    // Determine if birth data is sufficient to queue natal generation
    const hasBirthData = Boolean(birthData?.dateOfBirth);
    const natalStatus = hasBirthData ? "queued" : "not_started";

    const fullName =
      birthData?.fullName ?? member.full_name ?? "Primary Member";

    // Calculate age group if DOB is available
    let ageGroup: "adult" | "child" = "adult";
    if (birthData?.dateOfBirth) {
      const dob = new Date(birthData.dateOfBirth);
      const ageYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      ageGroup = ageYears < 14 ? "child" : "adult";
    }

    await admin.from("community_family_members").insert({
      member_id: communityMemberId,
      full_name: fullName,
      date_of_birth: birthData?.dateOfBirth ?? null,
      birth_time: birthData?.birthTime ?? null,
      birth_city: birthData?.birthCity ?? null,
      birth_country: birthData?.birthCountry ?? null,
      relationship: "Self",
      age_group: ageGroup,
      natal_status: natalStatus,
    });

    console.log(
      `[provision-natal] Created self-profile for member ${communityMemberId}, natal_status=${natalStatus}`
    );
  } catch (err) {
    // Non-blocking — provisioning failure must not break user creation
    console.error("[provision-natal] Error provisioning natal readiness:", err);
  }
}
