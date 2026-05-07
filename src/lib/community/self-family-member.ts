import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type CommunitySelfMemberSource = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_city?: string | null;
  birth_country?: string | null;
};

type ExistingFamilyRow = {
  id: string;
  relationship: string | null;
  user_id: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  birth_lat: number | string | null;
  birth_lng: number | string | null;
  natal_report_id: string | null;
  updated_at: string | null;
  created_at: string | null;
};

function selfRowScore(row: ExistingFamilyRow): number {
  return (
    (row.birth_lat != null && row.birth_lng != null ? 4 : 0) +
    (row.user_id ? 2 : 0) +
    (row.natal_report_id ? 1 : 0)
  );
}

function sortStrongestSelfRow(a: ExistingFamilyRow, b: ExistingFamilyRow) {
  const scoreDelta = selfRowScore(b) - selfRowScore(a);
  if (scoreDelta !== 0) return scoreDelta;

  const aUpdated = (a.updated_at ?? a.created_at ?? "").toString();
  const bUpdated = (b.updated_at ?? b.created_at ?? "").toString();
  if (aUpdated !== bUpdated) return bUpdated.localeCompare(aUpdated);

  return (a.created_at ?? "").localeCompare(b.created_at ?? "");
}

/**
 * Guarantee the account owner exists in the household list as one canonical
 * `relationship='self'` row.
 *
 * Relationship charts, monthly transits, saved report linkage, and family
 * management all use `community_family_members.id` as the person identity.
 * Rendering the owner from `community_members` only in React would create a
 * display-only person that cannot participate in those workflows.
 */
export async function ensureCanonicalSelfFamilyMember(
  member: CommunitySelfMemberSource,
  userId: string,
  options?: { admin?: SupabaseClient },
): Promise<{ id: string; created: boolean } | null> {
  const admin = options?.admin ?? createAdminClient();
  const fullName = member.full_name?.trim() || "Self";

  const { data: existingRows, error: existingError } = await admin
    .from("community_family_members")
    .select(
      "id, relationship, user_id, full_name, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng, natal_report_id, updated_at, created_at",
    )
    .eq("member_id", member.id);

  if (existingError) {
    console.error(
      "[community/self-family-member] failed to load household rows:",
      existingError,
    );
    return null;
  }

  const rows = (existingRows ?? []) as ExistingFamilyRow[];
  const byUser = rows.find((row) => row.user_id === userId);
  const bySelf = rows
    .filter((row) => (row.relationship ?? "").toLowerCase() === "self")
    .sort(sortStrongestSelfRow)[0];
  const byName = rows.find(
    (row) => row.full_name?.toLowerCase() === fullName.toLowerCase(),
  );

  const existing = byUser ?? bySelf ?? byName;
  if (existing) {
    const patch: Record<string, unknown> = {
      user_id: userId,
      relationship: "self",
    };

    if (!existing.full_name && fullName) patch.full_name = fullName;
    if (!existing.date_of_birth && member.date_of_birth) {
      patch.date_of_birth = member.date_of_birth;
    }
    if (!existing.birth_time && member.birth_time) {
      patch.birth_time = member.birth_time;
    }
    if (!existing.birth_city && member.birth_city) {
      patch.birth_city = member.birth_city;
    }
    if (!existing.birth_country && member.birth_country) {
      patch.birth_country = member.birth_country;
    }

    const { error: updateError } = await admin
      .from("community_family_members")
      .update(patch)
      .eq("id", existing.id);

    if (updateError) {
      console.error(
        "[community/self-family-member] failed to normalize self row:",
        updateError,
      );
    }

    return { id: existing.id, created: false };
  }

  const { data: inserted, error: insertError } = await admin
    .from("community_family_members")
    .insert({
      member_id: member.id,
      user_id: userId,
      full_name: fullName,
      relationship: "self",
      age_group: "adult",
      date_of_birth: member.date_of_birth ?? null,
      birth_time: member.birth_time ?? null,
      birth_city: member.birth_city ?? null,
      birth_country: member.birth_country ?? null,
      natal_status: member.date_of_birth ? "queued" : "not_started",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    const pg = insertError as unknown as { code?: string } | null;
    if (pg?.code === "23505") {
      const { data: raced } = await admin
        .from("community_family_members")
        .select("id")
        .eq("member_id", member.id)
        .ilike("relationship", "self")
        .limit(1)
        .maybeSingle();
      if (raced?.id) return { id: raced.id as string, created: false };
    }

    console.error(
      "[community/self-family-member] failed to create self row:",
      insertError,
    );
    return null;
  }

  return { id: inserted.id as string, created: true };
}
