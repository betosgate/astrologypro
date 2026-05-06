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
  //
  // `bookings` does not have a user_id column; the user link lives on
  // `clients.user_id`, while bookings point to clients via `client_id`.
  // Resolve the user's client rows first, then pick the most recent booking
  // for any of those clients.
  const { data: clientRows } = await admin
    .from("clients")
    .select("id, full_name, birth_date, birth_time, birth_city, birth_lat, birth_lng, birth_timezone")
    .eq("user_id", userId);

  const clients = (clientRows ?? []) as Array<{
    id: string;
    full_name: string | null;
    birth_date: string | null;
    birth_time: string | null;
    birth_city: string | null;
    birth_lat: number | null;
    birth_lng: number | null;
    birth_timezone: string | null;
  }>;

  let client:
    | {
        full_name: string | null;
        birth_date: string | null;
        birth_time: string | null;
        birth_city: string | null;
        birth_lat: number | null;
        birth_lng: number | null;
        birth_timezone: string | null;
      }
    | undefined;

  if (clients.length > 0) {
    const { data: booking } = await admin
      .from("bookings")
      .select("client_id")
      .in(
        "client_id",
        clients.map((c) => c.id),
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const bookingClientId = (booking as { client_id?: string | null } | null)?.client_id;
    client = clients.find((c) => c.id === bookingClientId);
  }

  if (client && client.birth_date) {
    const { data: memberCountry } = await admin
      .from("community_members")
      .select("birth_country")
      .eq("id", memberId)
      .maybeSingle();
    const profileCountry = (memberCountry as { birth_country?: string | null } | null)
      ?.birth_country;
    const data = {
      source: "past_booking" as const,
      fullName: client.full_name ?? memberName ?? null,
      dateOfBirth: client.birth_date,
      birthTime: client.birth_time,
      birthCity: client.birth_city,
      birthCountry:
        typeof profileCountry === "string" && profileCountry.trim().length > 0
          ? profileCountry.trim()
          : null,
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
 * Ensure a canonical "self" row exists in community_family_members.
 *
 * Lookup priority (most specific → least):
 *   1. user_id match (the strongest canonical link — Phase 2 invite flow
 *      sets this when an invited member accepts)
 *   2. relationship='self' (case-insensitive) — there should only ever be
 *      one such row per member_id post-2026-05-06 (UNIQUE index added in
 *      `20260506000001_community_self_canonical_repair.sql`); if more than
 *      one is found we pick the strongest by score (valid lat/lng + linked
 *      user_id + has natal_report_id + latest update) instead of taking the
 *      first arbitrary row
 *   3. exact full_name match (last-resort, soft heuristic for legacy data)
 *
 * If a row is found we PATCH it. Only if nothing matches do we INSERT.
 *
 * This avoids the duplicate-self bug where a name-match miss + an existing
 * self row produced two coexisting rows for the same `member_id` — one with
 * complete coords, one without — confusing every UI that filters by birth
 * readiness.
 *
 * Sprint: tasks/06.05.2026/community-transits-profile-and-display-fixes/01-fix-duplicate-self-profile-coordinate-readiness.md
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

  // Pull every row for this member; we evaluate priority in code so the
  // resolution order is auditable.
  const { data: existingRows } = await admin
    .from("community_family_members")
    .select(
      "id, relationship, user_id, full_name, birth_lat, birth_lng, natal_report_id, updated_at, created_at",
    )
    .eq("member_id", memberId);

  type Row = {
    id: string;
    relationship: string | null;
    user_id: string | null;
    full_name: string | null;
    birth_lat: number | string | null;
    birth_lng: number | string | null;
    natal_report_id: string | null;
    updated_at: string | null;
    created_at: string | null;
  };
  const rows = (existingRows ?? []) as Row[];

  // Score: same shape used by the canonical-repair migration so the
  // application picks the same row Postgres would pick.
  const score = (r: Row): number => {
    const hasCoords = r.birth_lat != null && r.birth_lng != null ? 4 : 0;
    const hasUser = r.user_id ? 2 : 0;
    const hasReport = r.natal_report_id ? 1 : 0;
    return hasCoords + hasUser + hasReport;
  };
  const tieBreak = (a: Row, b: Row): number => {
    const sa = score(a);
    const sb = score(b);
    if (sa !== sb) return sb - sa;
    const ua = (a.updated_at ?? a.created_at ?? "").toString();
    const ub = (b.updated_at ?? b.created_at ?? "").toString();
    if (ua !== ub) return ub.localeCompare(ua);
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  };

  // 1. Strongest signal: user_id match.
  const byUser = rows.filter((r) => r.user_id === userId);
  // 2. Any row labelled 'self' (case-insensitive). Sorted strongest first
  //    so we never pick the empty-coords row when a complete one exists.
  const bySelf = rows
    .filter((r) => (r.relationship ?? "").toLowerCase() === "self")
    .sort(tieBreak);
  // 3. Soft fallback: exact full-name match.
  const byName = rows.filter(
    (r) => r.full_name?.toLowerCase() === birthData.fullName.toLowerCase(),
  );

  const existing: Row | undefined = byUser[0] ?? bySelf[0] ?? byName[0];

  if (existing) {
    // Non-destructive patch: only overwrite a column when we have a value.
    // Avoids clobbering existing coords/time when this caller didn't carry
    // those fields (some endpoints only know name + DOB).
    const patch: Record<string, unknown> = {
      user_id: userId,
      relationship: "self",
      date_of_birth: birthData.dateOfBirth,
    };
    if (birthData.birthTime !== null) patch.birth_time = birthData.birthTime;
    if (birthData.birthCity !== null) patch.birth_city = birthData.birthCity;
    if (birthData.birthCountry !== null)
      patch.birth_country = birthData.birthCountry;
    if (birthData.birthLat !== null) patch.birth_lat = birthData.birthLat;
    if (birthData.birthLng !== null) patch.birth_lng = birthData.birthLng;

    await admin
      .from("community_family_members")
      .update(patch)
      .eq("id", existing.id);
    return { id: existing.id, created: false };
  }

  // No matching row — INSERT a new canonical self. The
  // `ux_family_members_one_self_per_member` partial UNIQUE index (added
  // 2026-05-06) prevents a race from producing a second self row.
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
    // 23505 = unique_violation — a parallel call won the race; re-fetch
    // the canonical row and treat as found.
    const pg = error as unknown as { code?: string } | null;
    if (pg?.code === "23505") {
      const { data: raced } = await admin
        .from("community_family_members")
        .select("id")
        .eq("member_id", memberId)
        .ilike("relationship", "self")
        .limit(1)
        .maybeSingle();
      if (raced?.id) return { id: raced.id as string, created: false };
    }
    throw new Error(error?.message ?? "Failed to create self family member");
  }

  return { id: inserted.id, created: true };
}
