import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Invited-diviner provisioner.
 *
 * Spec source:
 *   docs/tasks/2026-04-30/diviner-invite-registration-plan-gating.md
 *
 * Mirrors `provisionTraineeDivinerUpgradeFromSession` for the
 * invited-diviner flow:
 *   /admin/invitations  ──invite──▶  email
 *                                    └─▶ /join/diviner   (registration creates auth user + diviners row)
 *                                          └─▶ /join/diviner/plan
 *                                                └─▶ Stripe Checkout (type=invited_diviner)
 *                                                      └─▶ webhook + success page → THIS MODULE
 *
 * Differences from the trainee version:
 *   - Does NOT read from `trainees` (the user has no trainee history).
 *   - Does NOT create the `diviners` row — `/api/join/diviner/register`
 *     already inserted it. We UPDATE it with the paid-state fields.
 *   - The session-type discriminator is `"invited_diviner"`.
 *
 * Idempotent: callers (the success page and the Stripe webhook) may both
 * race to flip the diviner to active — the underlying SQL UPDATE is safe
 * to run twice.
 */

export interface InvitedDivinerProvisionResult {
  userId: string;
  divinerId: string;
  email: string;
  username: string;
  displayName: string;
  planId: string | null;
  divinerSaved: boolean;
}

export async function provisionInvitedDivinerFromSession(
  session: Stripe.Checkout.Session,
  options?: { expectedUserId?: string }
): Promise<InvitedDivinerProvisionResult | null> {
  if (session.metadata?.type !== "invited_diviner") return null;
  if (session.status !== "complete") return null;

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error(
      "[invited-diviner-upgrade] Missing userId in checkout metadata",
      session.metadata
    );
    return null;
  }
  if (options?.expectedUserId && options.expectedUserId !== userId) {
    console.error(
      "[invited-diviner-upgrade] Session user mismatch",
      {
        expectedUserId: options.expectedUserId,
        sessionUserId: userId,
        sessionId: session.id,
      }
    );
    return null;
  }

  const planId = session.metadata?.planId ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const admin = createAdminClient();

  // Locate the diviner row created during /api/join/diviner/register.
  const { data: diviner, error: divErr } = await admin
    .from("diviners")
    .select("id, user_id, username, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (divErr || !diviner) {
    console.error(
      "[invited-diviner-upgrade] No diviner record to update for userId",
      { userId, error: divErr?.message }
    );
    return null;
  }

  const {
    data: { user: authUser },
  } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.email ?? "";

  const updatePayload: Record<string, unknown> = {
    subscription_status: "active",
    onboarding_completed: true,
    is_active: true,
    updated_at: new Date().toISOString(),
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    ...(planId ? { plan_id: planId } : {}),
  };

  const { error: updateErr } = await admin
    .from("diviners")
    .update(updatePayload)
    .eq("user_id", userId);

  if (updateErr) {
    console.error(
      "[invited-diviner-upgrade] Failed to flip diviner to paid state:",
      updateErr
    );
    return {
      userId,
      divinerId: diviner.id,
      email,
      username: diviner.username,
      displayName: diviner.display_name,
      planId,
      divinerSaved: false,
    };
  }

  // Mark the original invitation as completed in metadata so the admin
  // status label can read 'Completed' even before the next subscription
  // refresh. We can't move `invitations.status` past 'accepted' without a
  // migration (the column has a CHECK constraint), so we tag metadata
  // instead — a no-op for non-diviner invitations.
  try {
    await admin
      .from("invitations")
      .update({
        metadata: {
          completed_at: new Date().toISOString(),
          stripe_session_id: session.id,
          plan_id: planId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .eq("role_slug", "diviner")
      .eq("status", "accepted");
  } catch (e) {
    // Non-fatal — admin label resolution falls back to the live diviner
    // subscription_status read.
    console.warn(
      "[invited-diviner-upgrade] invitations metadata stamp failed:",
      e instanceof Error ? e.message : e
    );
  }

  return {
    userId,
    divinerId: diviner.id,
    email,
    username: diviner.username,
    displayName: diviner.display_name,
    planId,
    divinerSaved: true,
  };
}

export async function finalizeInvitedDivinerFromSessionId(params: {
  sessionId: string;
  userId: string;
}): Promise<InvitedDivinerProvisionResult | null> {
  const session = await stripe.checkout.sessions.retrieve(params.sessionId);
  return provisionInvitedDivinerFromSession(session, {
    expectedUserId: params.userId,
  });
}
