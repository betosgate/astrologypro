/**
 * Birth Data Resolver for PM members
 *
 * Priority fallback to find a user's birth data without re-prompting:
 *   1. community_family_members where relationship = 'self' (or matching full_name)
 *   2. clients row from any past booking under this user_id
 *   3. community_members own fields (date_of_birth, birth_time, birth_city,
 *      birth_country)
 *
 * Returns a normalized shape + the source label so UI can show
 * "Using data from past booking" etc.
 *
 * Note on birth_country (22.04.2026 birth-country bundle):
 *   The full location record is {birth_city, birth_country, birth_lat,
 *   birth_lng} — city alone is not sufficient. The shared Horoscope Toolkit
 *   (`/community/horoscope`) requires birth_country, so it is selected,
 *   tracked in `missing`, and back-filled from `community_members.birth_country`
 *   whenever the winning family_self row's country is null. See
 *   `tasks/22.04.2026/community-horoscope-birth-country`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type BirthDataSource = "family_self" | "past_booking" | "member_profile" | "none";

export interface ResolvedBirthData {
  source: BirthDataSource;
  fullName: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  birthTime: string | null;   // HH:MM (24h)
  birthCity: string | null;
  birthCountry: string | null;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: string | null;
  /** family_member_id of the self-row if one exists (else null) */
  selfFamilyMemberId: string | null;
  /** Fields that are missing for a complete chart */
  missing: string[];
}

function emptyResult(): ResolvedBirthData {
  return {
    source: "none",
    fullName: null,
    dateOfBirth: null,
    birthTime: null,
    birthCity: null,
    birthCountry: null,
    birthLat: null,
    birthLng: null,
    birthTimezone: null,
    selfFamilyMemberId: null,
    // Keep this list aligned with `computeMissing()` — `/community/horoscope`
    // renders its amber card using the same field keys, so any field the
    // toolkit gates on must be reported here too.
    missing: ["dateOfBirth", "birthTime", "birthCity", "birthCountry"],
  };
}

function computeMissing(data: Partial<ResolvedBirthData>): string[] {
  const missing: string[] = [];
  if (!data.dateOfBirth) missing.push("dateOfBirth");
  if (!data.birthTime) missing.push("birthTime");
  if (!data.birthCity) missing.push("birthCity");
  // Required for the shared HoroscopeToolkitPage (`/community/horoscope`)
  // to render. The profile form + onboarding both persist this on
  // `community_members.birth_country`; resolver must check it here so
  // consumers see a consistent contract.
  if (!data.birthCountry) missing.push("birthCountry");
  // Coordinates are not user-visible but required for compute
  if (data.birthLat == null || data.birthLng == null) missing.push("coordinates");
  return missing;
}

/**
 * Resolve birth data for a PM user by priority fallback.
 *
 * @param userId    auth.users.id
 * @param memberId  community_members.id
 * @param memberName full_name from community_members (used to match self in family)
 */
export async function resolveUserBirthData(
  userId: string,
  memberId: string,
  memberName: string | null
): Promise<ResolvedBirthData> {
  const admin = createAdminClient();

  // ── 1. Try community_family_members self-row ──────────────────────────────
  // "self" match = exact user_id reference OR relationship='self' OR name match
  const { data: familyRows } = await admin
    .from("community_family_members")
    .select(
      "id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, relationship, user_id"
    )
    .eq("member_id", memberId);

  const family = (familyRows ?? []) as Array<{
    id: string;
    full_name: string;
    date_of_birth: string | null;
    birth_time: string | null;
    birth_city: string | null;
    birth_country: string | null;
    birth_lat: number | null;
    birth_lng: number | null;
    relationship: string | null;
    user_id: string | null;
  }>;

  const selfRow =
    family.find((f) => f.user_id === userId) ??
    family.find((f) => (f.relationship ?? "").toLowerCase() === "self") ??
    (memberName
      ? family.find((f) => f.full_name?.toLowerCase() === memberName.toLowerCase())
      : undefined);

  if (selfRow && selfRow.date_of_birth) {
    // Stale-self-row fallback (22.04.2026 birth-country bundle):
    // A `community_family_members` self-row created before the
    // `birth_country` column existed (or imported from a source that
    // didn't populate it) can win priority 1 with every other field
    // filled but `birth_country IS NULL`. That would leave
    // `/community/horoscope` stuck on "missing Birth country" even
    // after the user has saved their country on `/community/profile`.
    //
    // Rule: ONLY fill the missing country from `community_members.birth_country`
    // when the winning self-row has no country. Never overwrite a
    // non-null family country — the family record remains the source
    // of truth for that member's location.
    let resolvedCountry: string | null = selfRow.birth_country ?? null;
    if (!resolvedCountry) {
      const { data: memberCountry } = await admin
        .from("community_members")
        .select("birth_country")
        .eq("id", memberId)
        .maybeSingle();
      const fromProfile = (memberCountry as { birth_country?: string | null } | null)
        ?.birth_country;
      if (typeof fromProfile === "string" && fromProfile.trim().length > 0) {
        resolvedCountry = fromProfile.trim();
      }
    }

    const data = {
      source: "family_self" as const,
      fullName: selfRow.full_name ?? memberName ?? null,
      dateOfBirth: selfRow.date_of_birth,
      birthTime: selfRow.birth_time,
      birthCity: selfRow.birth_city,
      birthCountry: resolvedCountry,
      birthLat: selfRow.birth_lat,
      birthLng: selfRow.birth_lng,
      birthTimezone: null,
      selfFamilyMemberId: selfRow.id,
    };
    return { ...data, missing: computeMissing(data) };
  }

  // ── 2. Try clients row from past booking ──────────────────────────────────
  const { data: booking } = await admin
    .from("bookings")
    .select("clients(id, full_name, birth_date, birth_time, birth_city, birth_lat, birth_lng, birth_timezone)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const client = (booking as unknown as {
    clients?: {
      full_name: string | null;
      birth_date: string | null;
      birth_time: string | null;
      birth_city: string | null;
      birth_lat: number | null;
      birth_lng: number | null;
      birth_timezone: string | null;
    } | null;
  })?.clients;

  if (client && client.birth_date) {
    const data = {
      source: "past_booking" as const,
      fullName: client.full_name ?? memberName ?? null,
      dateOfBirth: client.birth_date,
      birthTime: client.birth_time,
      birthCity: client.birth_city,
      birthCountry: null,
      birthLat: client.birth_lat,
      birthLng: client.birth_lng,
      birthTimezone: client.birth_timezone,
      selfFamilyMemberId: selfRow?.id ?? null,
    };
    return { ...data, missing: computeMissing(data) };
  }

  // ── 3. Try community_members own fields ───────────────────────────────────
  //
  // birth_country is selected here so the profile fallback can satisfy the
  // Horoscope Toolkit's country requirement. The column is provisioned by
  // migration `20260422000006_add_birth_country_to_community_members.sql`.
  const { data: member } = await admin
    .from("community_members")
    .select("full_name, date_of_birth, birth_time, birth_city, birth_country")
    .eq("id", memberId)
    .maybeSingle();

  if (member && member.date_of_birth) {
    const data = {
      source: "member_profile" as const,
      fullName: member.full_name ?? memberName ?? null,
      dateOfBirth: member.date_of_birth,
      birthTime: member.birth_time,
      birthCity: member.birth_city,
      birthCountry: (member as { birth_country?: string | null }).birth_country ?? null,
      birthLat: null,
      birthLng: null,
      birthTimezone: null,
      selfFamilyMemberId: selfRow?.id ?? null,
    };
    return { ...data, missing: computeMissing(data) };
  }

  // ── 4. Nothing on file ────────────────────────────────────────────────────
  return {
    ...emptyResult(),
    fullName: memberName ?? null,
    selfFamilyMemberId: selfRow?.id ?? null,
  };
}

/**
 * Ensure a "self" row exists in community_family_members.
 * If one doesn't exist, create it using the provided birth data.
 * Returns the family_member_id.
 */
export async function findOrCreateSelfFamilyMember(
  _supabase: SupabaseClient,
  userId: string,
  memberId: string,
  birthData: {
    fullName: string;
    dateOfBirth: string;
    birthTime: string | null;
    birthCity: string | null;
    birthCountry: string | null;
    birthLat: number | null;
    birthLng: number | null;
  }
): Promise<{ id: string; created: boolean }> {
  const admin = createAdminClient();

  // Look for an existing self row
  const { data: existingRows } = await admin
    .from("community_family_members")
    .select("id, relationship, user_id, full_name")
    .eq("member_id", memberId);

  const existing = (existingRows ?? []).find(
    (r: { user_id?: string | null; relationship?: string | null; full_name?: string | null }) =>
      r.user_id === userId ||
      (r.relationship ?? "").toLowerCase() === "self" ||
      r.full_name?.toLowerCase() === birthData.fullName.toLowerCase()
  );

  if (existing) {
    // Patch any missing fields (non-destructive)
    await admin
      .from("community_family_members")
      .update({
        user_id: userId,
        relationship: "self",
        date_of_birth: birthData.dateOfBirth,
        birth_time: birthData.birthTime,
        birth_city: birthData.birthCity,
        birth_country: birthData.birthCountry,
        birth_lat: birthData.birthLat,
        birth_lng: birthData.birthLng,
      })
      .eq("id", existing.id);
    return { id: existing.id, created: false };
  }

  // Create a new self row
  const { data: inserted, error } = await admin
    .from("community_family_members")
    .insert({
      member_id: memberId,
      user_id: userId,
      full_name: birthData.fullName,
      relationship: "self",
      age_group: "adult",
      date_of_birth: birthData.dateOfBirth,
      birth_time: birthData.birthTime,
      birth_city: birthData.birthCity,
      birth_country: birthData.birthCountry,
      birth_lat: birthData.birthLat,
      birth_lng: birthData.birthLng,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to create self family member");
  }

  return { id: inserted.id, created: true };
}
