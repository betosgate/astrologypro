import Stripe from "stripe";
import { ensureUserContractRequirements } from "@/lib/contract-orchestration";
import { provisionNatalReadiness } from "@/lib/community/provision-natal-readiness";
import { tierToPlanType } from "@/lib/community/pm-entitlement";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

type PmPlanType = "individual" | "couple" | "family";

export interface PerennialCommunityCheckoutFinalizationResult {
  userId: string;
  email: string;
  fullName: string | null;
  planId: string | null;
  planType: PmPlanType;
  communityMemberId: string | null;
  communityMemberSaved: boolean;
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function inferPmPlanType(
  planType: string | null | undefined,
  planId: string | null | undefined,
): PmPlanType {
  const value = `${planType ?? ""} ${planId ?? ""}`.toLowerCase();
  if (value.includes("family")) return "family";
  if (value.includes("couple")) return "couple";
  return "individual";
}

function splitFullName(fullName: string | null) {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? null;
  const lastName = parts.length > 0 ? parts.join(" ") : null;
  return { firstName, lastName };
}

export async function finalizePerennialCommunityCheckoutSession(
  session: Stripe.Checkout.Session,
  options?: {
    expectedUserId?: string;
    ensureContracts?: boolean;
  },
): Promise<PerennialCommunityCheckoutFinalizationResult | null> {
  const metadata = session.metadata ?? {};
  const userId = metadata.userId;
  const membershipType = metadata.membershipType;

  if (
    metadata.type !== "community" ||
    membershipType !== "perennial_mandalism" ||
    !userId
  ) {
    return null;
  }

  if (options?.expectedUserId && options.expectedUserId !== userId) {
    console.error("[community/finalize-checkout] Session user mismatch", {
      expectedUserId: options.expectedUserId,
      sessionUserId: userId,
      sessionId: session.id,
    });
    return null;
  }

  const planId = cleanString(metadata.planId);
  const planType = inferPmPlanType(metadata.planType, planId);

  if (session.status !== "complete" || session.payment_status === "unpaid") {
    return {
      userId,
      email: "",
      fullName: null,
      planId,
      planType,
      communityMemberId: null,
      communityMemberSaved: false,
    };
  }

  const admin = createAdminClient();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const [
    {
      data: { user: authUser },
    },
    { data: trainee },
    { data: client },
    { data: existingMember },
  ] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("trainees")
      .select("id, name, email, username, phone, timezone, goals, specialties")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("clients")
      .select("email, full_name, phone, birth_date, birth_time, birth_city")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("community_members")
      .select("id, email, full_name, first_name, last_name, phone, joined_at, intake_data, extra_member_count, date_of_birth, birth_time, birth_city, birth_country")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const email =
    cleanString(trainee?.email) ??
    cleanString(client?.email) ??
    cleanString(authUser?.email) ??
    cleanString(existingMember?.email) ??
    "";

  if (!email) {
    console.error("[community/finalize-checkout] Missing email for checkout", {
      userId,
      sessionId: session.id,
    });
    return {
      userId,
      email: "",
      fullName: null,
      planId,
      planType,
      communityMemberId: null,
      communityMemberSaved: false,
    };
  }

  const fullName =
    cleanString(trainee?.name) ??
    cleanString(client?.full_name) ??
    cleanString(authUser?.user_metadata?.full_name) ??
    cleanString(authUser?.user_metadata?.name) ??
    cleanString(existingMember?.full_name);
  const { firstName, lastName } = splitFullName(fullName);
  const phone =
    cleanString(trainee?.phone) ??
    cleanString(client?.phone) ??
    cleanString(existingMember?.phone);

  const explicitTargetTierId = cleanString(metadata.target_tier_id);
  let resolvedTierId: string | null = explicitTargetTierId;
  let resolvedTierName: string | null = null;

  if (resolvedTierId) {
    const { data: tierRow } = await admin
      .from("pm_plan_tiers")
      .select("id, name")
      .eq("id", resolvedTierId)
      .maybeSingle();
    resolvedTierName = cleanString(tierRow?.name);
  } else {
    const desiredTierName =
      planType === "family"
        ? "Family"
        : planType === "couple"
          ? "Couple"
          : "Individual";
    const { data: tierRow } = await admin
      .from("pm_plan_tiers")
      .select("id, name")
      .eq("is_active", true)
      .ilike("name", desiredTierName)
      .maybeSingle();
    resolvedTierId = cleanString(tierRow?.id);
    resolvedTierName = cleanString(tierRow?.name);
    if (!resolvedTierId) {
      console.warn(
        `[community/finalize-checkout] Could not resolve pm_tier_id for planType=${planType}`,
        { userId, sessionId: session.id },
      );
    }
  }

  const canonicalPlanType = resolvedTierName
    ? tierToPlanType({ name: resolvedTierName })
    : planType === "family" || planType === "couple"
      ? "family"
      : "individual";

  const existingIntake =
    existingMember?.intake_data && typeof existingMember.intake_data === "object"
      ? (existingMember.intake_data as Record<string, unknown>)
      : {};
  const sourcePortal = cleanString(metadata.sourcePortal);
  const intakeData: Record<string, unknown> = {
    ...existingIntake,
    checkout_session_id: session.id,
    signup_source: sourcePortal === "trainee" ? "trainee_pm_upgrade" : "community_checkout",
    ...(planId ? { selected_plan_id: planId } : {}),
    ...(sourcePortal ? { source_portal: sourcePortal } : {}),
    ...(trainee
      ? {
          trainee_profile: {
            id: trainee.id,
            username: trainee.username ?? null,
            timezone: trainee.timezone ?? null,
            goals: trainee.goals ?? null,
            specialties: trainee.specialties ?? [],
          },
        }
      : {}),
  };

  const birthDate =
    cleanString(client?.birth_date) ?? cleanString(existingMember?.date_of_birth);
  const birthTime =
    cleanString(client?.birth_time) ?? cleanString(existingMember?.birth_time);
  const birthCity =
    cleanString(client?.birth_city) ?? cleanString(existingMember?.birth_city);
  const birthCountry = cleanString(existingMember?.birth_country);

  const memberPayload: Record<string, unknown> = {
    user_id: userId,
    email,
    membership_type: "perennial_mandalism",
    membership_status: "active",
    plan_type: canonicalPlanType,
    joined_at: existingMember?.joined_at ?? new Date().toISOString(),
    intake_data: intakeData,
    extra_member_count: existingMember?.extra_member_count ?? 0,
    ...(fullName ? { full_name: fullName } : {}),
    ...(firstName ? { first_name: firstName } : {}),
    ...(lastName ? { last_name: lastName } : {}),
    ...(phone ? { phone } : {}),
    ...(customerId ? { stripe_customer_id: customerId } : {}),
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    ...(resolvedTierId ? { pm_tier_id: resolvedTierId } : {}),
    ...(birthDate ? { date_of_birth: birthDate } : {}),
    ...(birthTime ? { birth_time: birthTime } : {}),
    ...(birthCity ? { birth_city: birthCity } : {}),
    ...(birthCountry ? { birth_country: birthCountry } : {}),
  };

  const { data: member, error: memberError } = await admin
    .from("community_members")
    .upsert(memberPayload, { onConflict: "user_id" })
    .select("id")
    .single();

  if (memberError) {
    console.error(
      "[community/finalize-checkout] Failed to upsert community member:",
      memberError,
    );
    return {
      userId,
      email,
      fullName,
      planId,
      planType,
      communityMemberId: null,
      communityMemberSaved: false,
    };
  }

  const communityMemberId = member?.id ?? null;

  if (communityMemberId) {
    await provisionNatalReadiness({
      admin,
      communityMemberId,
      userId,
      birthData: {
        fullName,
        dateOfBirth: birthDate,
        birthTime,
        birthCity,
        birthCountry,
      },
    });
  }

  if (options?.ensureContracts) {
    await ensureUserContractRequirements(userId, "post_login");
  }

  return {
    userId,
    email,
    fullName,
    planId,
    planType,
    communityMemberId,
    communityMemberSaved: Boolean(communityMemberId),
  };
}

export async function finalizePerennialCommunityCheckoutFromSessionId(params: {
  sessionId: string;
  userId: string;
  ensureContracts?: boolean;
}) {
  const session = await stripe.checkout.sessions.retrieve(params.sessionId);

  return finalizePerennialCommunityCheckoutSession(session, {
    expectedUserId: params.userId,
    ensureContracts: params.ensureContracts,
  });
}
