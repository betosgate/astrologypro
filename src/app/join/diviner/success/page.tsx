import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finalizeInvitedDivinerFromSessionId } from "@/lib/invited-diviner-upgrade";

export const dynamic = "force-dynamic";

/**
 * /join/diviner/success
 *
 * Spec source:
 *   docs/tasks/2026-04-30/diviner-invite-registration-plan-gating.md
 *
 * Stripe Checkout success URL for the invited-diviner flow.
 *
 * Stripe sends the user here after a successful payment. We finalize the
 * provisioning server-side from `session_id` so the dashboard gate
 * (which checks diviners.subscription_status='active') always passes by
 * the time we redirect — no race against the webhook.
 */
export default async function JoinDivinerSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const resolved = searchParams ? await searchParams : {};
  const sessionIdParam = resolved.session_id;
  const sessionId = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;

  if (!sessionId) {
    redirect("/join/diviner/plan?error=missing-session");
  }

  const result = await finalizeInvitedDivinerFromSessionId({
    sessionId: sessionId as string,
    userId: user.id,
  });

  if (!result?.divinerSaved) {
    // The webhook will retry, but for now we bounce the user back so
    // they aren't stranded on a blank page.
    redirect("/join/diviner/plan?error=provision-failed");
  }

  redirect("/dashboard");
}
