import Stripe from "stripe";
import { ensureUserContractRequirements } from "@/lib/contract-orchestration";
import {
  getDefaultRoleServicePackageCode,
  getRoleServicePackages,
} from "@/lib/role-service-packages";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

function buildFallbackUsername(email: string | null | undefined, userId: string) {
  const emailLocal = email?.split("@")[0]?.trim().toLowerCase() ?? "";
  const sanitized = emailLocal.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return (sanitized || "diviner") + `-${userId.slice(0, 6)}`;
}

export interface TraineeDivinerUpgradeProvisionResult {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  planId: string | null;
  divinerSaved: boolean;
}

export async function provisionTraineeDivinerUpgradeFromSession(
  session: Stripe.Checkout.Session,
  options?: {
    expectedUserId?: string;
    markTraineePaid?: boolean;
    ensureContracts?: boolean;
  },
): Promise<TraineeDivinerUpgradeProvisionResult | null> {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId ?? null;

  if (!userId) {
    console.error(
      "[trainee-diviner-upgrade] Missing userId in checkout session metadata",
      session.metadata,
    );
    return null;
  }

  if (options?.expectedUserId && options.expectedUserId !== userId) {
    console.error(
      "[trainee-diviner-upgrade] Session user mismatch",
      { expectedUserId: options.expectedUserId, sessionUserId: userId, sessionId: session.id },
    );
    return null;
  }

  if (session.metadata?.type !== "trainee_diviner_upgrade") {
    return null;
  }

  if (session.status !== "complete") {
    return null;
  }

  const admin = createAdminClient();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const [
    {
      data: { user: authUser },
    },
    { data: trainee },
    roleServicePackages,
  ] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("trainees")
      .select("id, name, email, username, service_package_code")
      .eq("user_id", userId)
      .maybeSingle(),
    getRoleServicePackages(),
  ]);

  const email = trainee?.email ?? authUser?.email ?? "";
  const username =
    trainee?.username ??
    (authUser?.user_metadata?.username as string | undefined) ??
    buildFallbackUsername(authUser?.email, userId);
  const displayName =
    trainee?.name ??
    (authUser?.user_metadata?.name as string | undefined) ??
    email.split("@")[0] ??
    "Diviner";
  const servicePackageCode =
    trainee?.service_package_code ??
    getDefaultRoleServicePackageCode(roleServicePackages, "diviner");

  const divinerPayload: Record<string, unknown> = {
    user_id: userId,
    username,
    display_name: displayName,
    onboarding_completed: true,
    onboarding_step: 5,
    is_active: true,
    subscription_status: "active",
    service_package_code: servicePackageCode,
    ...(planId ? { plan_id: planId } : {}),
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
  };

  const { error: divinerError } = await admin
    .from("diviners")
    .upsert(divinerPayload, { onConflict: "user_id" });

  if (divinerError) {
    console.error(
      "[trainee-diviner-upgrade] Failed to upsert diviner record:",
      divinerError,
    );
    return {
      userId,
      email,
      username,
      displayName,
      planId,
      divinerSaved: false,
    };
  }

  if (options?.markTraineePaid) {
    const traineeUpdate: Record<string, unknown> = {
      paid_at: new Date().toISOString(),
    };

    if (paymentIntentId) {
      traineeUpdate.payment_intent_id = paymentIntentId;
    }

    const { error: traineeError } = await admin
      .from("trainees")
      .update(traineeUpdate)
      .eq("user_id", userId);

    if (traineeError) {
      console.warn(
        "[trainee-diviner-upgrade] Failed to update trainee payment fields:",
        traineeError,
      );
    }
  }

  if (options?.ensureContracts) {
    await ensureUserContractRequirements(userId, "post_login");
  }

  return {
    userId,
    email,
    username,
    displayName,
    planId,
    divinerSaved: true,
  };
}

export async function finalizeTraineeDivinerUpgradeFromSessionId(params: {
  sessionId: string;
  userId: string;
  markTraineePaid?: boolean;
  ensureContracts?: boolean;
}) {
  const session = await stripe.checkout.sessions.retrieve(params.sessionId);

  return provisionTraineeDivinerUpgradeFromSession(session, {
    expectedUserId: params.userId,
    markTraineePaid: params.markTraineePaid,
    ensureContracts: params.ensureContracts,
  });
}
