/**
 * resolve-login-destination
 *
 * Single source of truth for post-login redirect logic.
 * Used by both the magic-link callback (/auth/callback) and the
 * password login redirect (/api/auth/post-login-redirect).
 *
 * Priority order:
 *  1. Pending contract destination (legal gate — must sign before entering portal)
 *  2. Admin users → /admin
 *  3. Saved last_portal_url in user_portal_preferences → return there
 *  4. First visit → pick highest portal by role hierarchy, gate on onboarding
 *
 * Role hierarchy (highest → lowest):
 *  admin > diviner > trainee > social_advo > perennial_mandalism > mystery_school > client
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { hasValidMysterySchoolBilling } from "@/lib/mystery-school/access";
import { getInvitedRoleDestination } from "@/lib/invite-destinations";
import { getPendingContractDestination } from "@/lib/contract-orchestration";

export const VALID_PORTAL_BASES = [
  "/dashboard",
  "/portal",
  "/community",
  "/mystery-school",
  "/trainee",
  "/advocate",
  "/admin",
];

export function isTrustedPortal(url: string): boolean {
  return VALID_PORTAL_BASES.some(
    (base) => url === base || url.startsWith(base + "/")
  );
}

function needsInvitedDivinerPlan(
  diviner: PortalCheckData["diviner"]
): boolean {
  return (
    !!diviner &&
    !diviner.onboarding_completed &&
    diviner.subscription_status !== "active"
  );
}

// ── Role hierarchy ────────────────────────────────────────────────────────────
// Lower index = higher priority.
const ROLE_HIERARCHY: Array<{
  role: string;
  check: (data: PortalCheckData) => boolean;
  destination: (data: PortalCheckData, isInvited: boolean) => string;
}> = [
  {
    role: "diviner",
    check: (d) => !!d.diviner,
    destination: (d, isInvited) => {
      // Invited-diviner gate (docs/tasks/2026-04-30): a freshly-
      // registered invited diviner whose Stripe subscription is not
      // yet 'active' must be sent to /join/diviner/plan on every
      // login. The discriminator (onboarding_completed=false AND
      // subscription_status!='active') uniquely identifies the
      // invited-but-unpaid state without breaking existing diviners
      // whose wizard set onboarding_completed=true with a 'trialing'
      // subscription. Mirrors the dashboard layout server gate.
      if (needsInvitedDivinerPlan(d.diviner)) {
        return "/join/diviner/plan";
      }
      if (!d.diviner?.onboarding_completed) {
        return isInvited ? getInvitedRoleDestination("diviner") : "/onboarding";
      }
      return "/dashboard";
    },
  },
  {
    role: "trainee",
    check: (d) => !!d.trainee,
    destination: (d, isInvited) => {
      if (!d.trainee?.onboarding_completed) {
        return isInvited ? getInvitedRoleDestination("trainee") : "/join/trainee/profile";
      }
      return "/trainee";
    },
  },
  {
    role: "social_advo",
    check: (d) => !!d.advocate,
    destination: (d, isInvited) => {
      if (!d.advocate?.onboarding_completed) {
        return isInvited ? getInvitedRoleDestination("social_advo") : "/join/advocate";
      }
      return "/advocate";
    },
  },
  {
    role: "perennial_mandalism",
    check: (d) =>
      !!d.community &&
      d.community.membership_type === "perennial_mandalism" &&
      d.community.membership_status === "active",
    destination: (d, isInvited) => {
      if (!d.community?.onboarding_completed) {
        return isInvited
          ? getInvitedRoleDestination("perennial_mandalism")
          : "/community/onboarding";
      }
      return "/community";
    },
  },
  {
    role: "mystery_school",
    check: (d) => {
      if (!d.mysteryStudent) return false;
      const ms = d.mysteryStudent;
      const isCancelledWithAccess =
        ms.status === "cancelled" &&
        !!ms.access_expires_at &&
        new Date(ms.access_expires_at) > new Date();
      return (
        hasValidMysterySchoolBilling(ms) &&
        (ms.status === "active" || isCancelledWithAccess)
      );
    },
    destination: (_d, isInvited) =>
      isInvited ? getInvitedRoleDestination("mystery_school") : "/mystery-school",
  },
  {
    role: "client",
    check: (d) => !!d.client,
    destination: () => "/portal",
  },
  {
    // Cancelled/inactive PM members who have no other qualifying role.
    // Sends them to the resubscribe page so they can reactivate.
    role: "perennial_mandalism_cancelled",
    check: (d) =>
      !!d.community &&
      d.community.membership_type === "perennial_mandalism" &&
      d.community.membership_status !== "active",
    destination: () => "/join/community/resubscribe",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface PortalCheckData {
  diviner: {
    id: string;
    onboarding_completed: boolean | null;
    subscription_status: string | null;
  } | null;
  trainee: { id: string; onboarding_completed: boolean | null } | null;
  advocate: { id: string; onboarding_completed: boolean | null } | null;
  mysteryStudent: {
    id: string;
    status: string;
    access_expires_at: string | null;
    stripe_subscription_id: string | null;
    one_time_fee_paid: boolean;
    one_time_fee_amount: number | null;
  } | null;
  community: {
    id: string;
    membership_type: string;
    membership_status: string;
    onboarding_completed: boolean | null;
  } | null;
  client: { id: string } | null;
}

export interface ResolveOptions {
  userId: string;
  isAdmin: boolean;
  isInvited: boolean;
  adminClient: SupabaseClient;
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export async function resolveLoginDestination({
  userId,
  isAdmin,
  isInvited,
  adminClient,
}: ResolveOptions): Promise<string> {
  // 1. Pending contract gate (legal — must sign before entering any portal)
  const { data: earlyDiviner } = await adminClient
    .from("diviners")
    .select("id, onboarding_completed, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (needsInvitedDivinerPlan(earlyDiviner as PortalCheckData["diviner"])) {
    return "/join/diviner/plan";
  }

  const pendingContract = await getPendingContractDestination(userId).catch(() => null);
  if (pendingContract && !isAdmin) return pendingContract;

  // 2. Admin shortcut — admin always goes to /admin unless they have a saved portal
  //    (admins can also be diviners, so we still check saved portal below)

  // 3. Check saved last portal
  const { data: prefs } = await adminClient
    .from("user_portal_preferences")
    .select("last_portal_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefs?.last_portal_url && isTrustedPortal(prefs.last_portal_url)) {
    return prefs.last_portal_url;
  }

  // 4. Admin with no saved portal → /admin
  if (isAdmin) return "/admin";

  // 5. First visit — fetch all role rows in parallel, pick by hierarchy
  const [diviner, trainee, advocate, mysteryStudent, community, client] =
    await Promise.all([
      Promise.resolve(earlyDiviner),
      adminClient
        .from("trainees")
        .select("id, onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle()
        .then((r) => r.data),
      adminClient
        .from("social_advocates")
        .select("id, onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle()
        .then((r) => r.data),
      adminClient
        .from("mystery_school_students")
        .select("id, status, access_expires_at, stripe_subscription_id, one_time_fee_paid, one_time_fee_amount")
        .eq("user_id", userId)
        .maybeSingle()
        .then((r) => r.data),
      adminClient
        .from("community_members")
        .select("id, membership_type, membership_status, onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle()
        .then((r) => r.data),
      adminClient
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle()
        .then((r) => r.data),
    ]);

  const checkData: PortalCheckData = {
    diviner: diviner as PortalCheckData["diviner"],
    trainee: trainee as PortalCheckData["trainee"],
    advocate: advocate as PortalCheckData["advocate"],
    mysteryStudent: mysteryStudent as PortalCheckData["mysteryStudent"],
    community: community as PortalCheckData["community"],
    client: client as PortalCheckData["client"],
  };

  // Pick the highest-priority role by the hierarchy order.
  // /switch is a manual navigation page only — never an automatic login destination.
  // Priority: onboarding gate first, then highest portal by role hierarchy.
  const qualifiedEntries = ROLE_HIERARCHY.filter((entry) =>
    entry.check(checkData)
  );

  if (qualifiedEntries.length === 0) return "/portal";

  return qualifiedEntries[0].destination(checkData, isInvited);
}
