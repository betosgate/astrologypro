/**
 * PM entitlement resolver — single source of truth for community plan gating.
 *
 * Per `tasks/23.04.2026/community-pm-entitlement-state-sync/00-audit-note.md`:
 *   - Canonical source: `community_members.pm_tier_id` → `pm_plan_tiers` row.
 *   - Legacy compat:    `community_members.plan_type` ∈ {"individual","family"}.
 *   - Mapping rule:     household-capable tiers (Couple / Family) → plan_type = 'family',
 *                       everything else                           → plan_type = 'individual'.
 *
 * Every surface that needs to decide "is this user Family-entitled?" /
 * "how many household members are allowed?" MUST go through this helper
 * so we don't re-derive the rule in each route.
 *
 * This module has no DB side effects — read-only resolver.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** A shape compatible with both service-role and auth-scoped Supabase clients. */
type AnySupabase = SupabaseClient<any, any, any>;

export type LegacyPlanType = "individual" | "family";

export interface PmPlanTierRow {
  id: string;
  name: string;
  description: string | null;
  base_price_usd: number;
  base_member_limit: number;
  extra_per_member_usd: number;
  max_total_members: number | null;
  stripe_price_id: string | null;
  stripe_extra_price_id: string | null;
  is_active: boolean;
}

export interface PmEntitlement {
  /** Resolved tier row, or null if pm_tier_id is NULL or no longer active. */
  tier: PmPlanTierRow | null;
  /**
   * True when the user is entitled to manage a household (add family members).
   * Currently: tier.name is Couple or Family. Falls back to legacy
   * plan_type='family' only when no tier is resolved.
   */
  isFamilyEntitled: boolean;
  /**
   * Hard ceiling on household-size (primary + family members). Uses
   * tier.max_total_members when available; otherwise 5 for Family / 1 for
   * Individual as a safe legacy fallback.
   */
  maxMembers: number;
  /**
   * The legacy plan_type value this entitlement should map to. Writers that
   * need to keep the `community_members.plan_type` column in sync with the
   * canonical tier should persist this value.
   */
  planTypeCanonical: LegacyPlanType;
  /**
   * Raw legacy value from community_members.plan_type, unchanged by this
   * helper. Useful for detecting drift — `plan_type_legacy !== plan_type_canonical`
   * means the row is out-of-sync and needs Task 04's backfill.
   */
  planTypeLegacy: LegacyPlanType;
  /** True when legacy and canonical disagree. Drives drift warnings. */
  hasDrift: boolean;
  /** Indicates we fell back to legacy plan_type because no tier resolved. */
  usedLegacyFallback: boolean;
}

/** Map a tier row to its legacy plan_type value. */
export function tierToPlanType(
  tier: Pick<PmPlanTierRow, "name"> | null,
): LegacyPlanType {
  if (!tier) return "individual";
  const tierName = tier.name.trim().toLowerCase();
  return tierName === "family" || tierName === "couple" ? "family" : "individual";
}

/**
 * Resolve the max household size for a given entitlement without needing the
 * full PmEntitlement struct. Used in validators.
 */
export function maxMembersForTier(
  tier: Pick<PmPlanTierRow, "max_total_members"> | null,
  fallbackPlanType: LegacyPlanType,
): number {
  if (tier?.max_total_members != null) return tier.max_total_members;
  return fallbackPlanType === "family" ? 5 : 1;
}

/**
 * Resolve entitlement from an already-loaded community_members row.
 *
 * Callers that have the member row in hand (most API routes) should use this
 * form to avoid an extra round-trip. For callers that only have a user id or
 * member id, use `resolveMemberEntitlement` below.
 */
export async function resolveEntitlementFromRow(
  admin: AnySupabase,
  member: { pm_tier_id: string | null; plan_type: string | null },
): Promise<PmEntitlement> {
  const planTypeLegacy: LegacyPlanType =
    member.plan_type === "family" ? "family" : "individual";

  let tier: PmPlanTierRow | null = null;
  if (member.pm_tier_id) {
    const { data } = await admin
      .from("pm_plan_tiers")
      .select(
        "id, name, description, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members, stripe_price_id, stripe_extra_price_id, is_active",
      )
      .eq("id", member.pm_tier_id)
      .maybeSingle();
    tier = (data as PmPlanTierRow | null) ?? null;
    if (tier && !tier.is_active) {
      console.warn(
        `[pm-entitlement] pm_tier_id=${member.pm_tier_id} resolves to an INACTIVE tier — treating as resolved but flagged`,
      );
    }
  }

  const planTypeCanonical: LegacyPlanType = tier
    ? tierToPlanType(tier)
    : planTypeLegacy;

  const isFamilyEntitled = tier
    ? tierToPlanType(tier) === "family"
    : planTypeLegacy === "family";

  const maxMembers = maxMembersForTier(tier, planTypeCanonical);

  return {
    tier,
    isFamilyEntitled,
    maxMembers,
    planTypeCanonical,
    planTypeLegacy,
    hasDrift: tier != null && planTypeCanonical !== planTypeLegacy,
    usedLegacyFallback: tier == null,
  };
}

/**
 * Convenience: resolve entitlement starting from the authenticated user_id.
 * Returns `null` if no community_members row exists.
 */
export async function resolveMemberEntitlement(
  admin: AnySupabase,
  userId: string,
): Promise<{ memberId: string; entitlement: PmEntitlement } | null> {
  const { data: member } = await admin
    .from("community_members")
    .select("id, pm_tier_id, plan_type")
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return null;
  const entitlement = await resolveEntitlementFromRow(admin, {
    pm_tier_id: (member.pm_tier_id as string | null) ?? null,
    plan_type: (member.plan_type as string | null) ?? null,
  });
  return { memberId: member.id as string, entitlement };
}
