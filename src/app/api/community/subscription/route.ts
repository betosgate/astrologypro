import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveEntitlementFromRow } from "@/lib/community/pm-entitlement";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/subscription
 *
 * Returns the authenticated user's community membership/subscription details.
 * Per `tasks/23.04.2026/community-pm-entitlement-state-sync/00-audit-note.md`,
 * `plan_type`, `plan_label`, `amount`, and `max_members` are derived from the
 * canonical `pm_tier_id → pm_plan_tiers` row when available, falling back to
 * the legacy `plan_type` column only when no tier resolves.
 *
 * Response shape:
 * {
 *   subscription: {
 *     membership_type: "perennial_mandalism" | "mystery_school",
 *     plan_type: "individual" | "family",
 *     plan_label: string,
 *     status: string,
 *     amount: number,
 *     currency: "usd",
 *     renewal_date: string | null,
 *     created_at: string,
 *     member_count: number,
 *     max_members: number,
 *   }
 * }
 */

// Legacy amount / label / max_members used only when no pm_plan_tier is
// resolved (Mystery School, or PM members who have never been through a
// Stripe flow — e.g. admin-provisioned households).
const LEGACY_PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  perennial_mandalism: { individual: 9.97, family: 19.97 },
  mystery_school: { individual: 27.0, family: 27.0 },
};

const PLAN_LABELS: Record<string, Record<string, string>> = {
  perennial_mandalism: {
    individual: "Perennial Mandalism — Single",
    family: "Perennial Mandalism — Family",
  },
  mystery_school: {
    individual: "Mystery School",
    family: "Mystery School",
  },
};

const LEGACY_MAX_MEMBERS: Record<string, number> = {
  individual: 1,
  family: 5,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: member, error } = await admin
      .from("community_members")
      .select(
        "id, membership_type, membership_status, plan_type, pm_tier_id, stripe_subscription_id, joined_at, expires_at"
      )
      .eq("user_id", user.id)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    const membershipType = (member.membership_type ?? "perennial_mandalism") as string;
    const isMysterySchool = membershipType === "mystery_school";

    // Resolve canonical entitlement. For MS users this still returns a result,
    // but we don't use the tier for amount/label — MS pricing is not tier-based.
    const entitlement = await resolveEntitlementFromRow(admin, {
      pm_tier_id: (member.pm_tier_id as string | null) ?? null,
      plan_type: (member.plan_type as string | null) ?? null,
    });

    if (entitlement.hasDrift) {
      console.warn(
        `[community/subscription] entitlement drift on member ${member.id}: tier='${entitlement.tier?.name}' (canonical=${entitlement.planTypeCanonical}) vs legacy plan_type=${entitlement.planTypeLegacy}`
      );
    }

    // Canonical plan_type is what the UI should render.
    const planType = entitlement.planTypeCanonical;

    // Count family members (only relevant for family plan)
    let memberCount = 1;
    if (planType === "family") {
      const { count } = await admin
        .from("community_family_members")
        .select("id", { count: "exact", head: true })
        .eq("member_id", member.id);
      // +1 to include the primary member themselves
      memberCount = (count ?? 0) + 1;
    }

    // Derive renewal_date: prefer expires_at, else derive from Stripe if available
    let renewalDate: string | null = member.expires_at ?? null;

    if (!renewalDate && member.stripe_subscription_id && member.membership_status === "active") {
      try {
        const { stripe } = await import("@/lib/stripe/client");
        const sub = await stripe.subscriptions.retrieve(
          member.stripe_subscription_id
        ) as unknown as { current_period_end?: number };
        if (sub.current_period_end) {
          renewalDate = new Date(sub.current_period_end * 1000).toISOString();
        }
      } catch {
        // Non-fatal — proceed without renewal date
      }
    }

    // Amount: PM uses the canonical tier's base_price_usd when resolved.
    // MS and legacy-fallback PM use the hardcoded LEGACY_PLAN_AMOUNTS map.
    const amount =
      !isMysterySchool && entitlement.tier?.base_price_usd != null
        ? Number(entitlement.tier.base_price_usd)
        : LEGACY_PLAN_AMOUNTS[membershipType]?.[planType] ??
          LEGACY_PLAN_AMOUNTS["perennial_mandalism"]["individual"];

    // Label: prefer the tier's own name when available (already user-facing).
    const planLabel =
      !isMysterySchool && entitlement.tier?.name
        ? `Perennial Mandalism — ${entitlement.tier.name}`
        : PLAN_LABELS[membershipType]?.[planType] ??
          PLAN_LABELS["perennial_mandalism"]["individual"];

    const maxMembers =
      !isMysterySchool && entitlement.tier?.max_total_members != null
        ? entitlement.tier.max_total_members
        : planType === "family"
          ? LEGACY_MAX_MEMBERS["family"]
          : LEGACY_MAX_MEMBERS["individual"];

    return NextResponse.json({
      subscription: {
        membership_type: membershipType,
        plan_type: planType,
        plan_label: planLabel,
        status: member.membership_status ?? "active",
        amount,
        currency: "usd",
        renewal_date: renewalDate,
        created_at: member.joined_at,
        member_count: Math.min(memberCount, maxMembers),
        max_members: maxMembers,
      },
    });
  } catch (err) {
    console.error("[community/subscription] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
