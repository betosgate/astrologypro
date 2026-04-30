import { redirect } from "next/navigation";
import { PendingContractsClient } from "@/components/legal/pending-contracts-client";
import {
  ensureUserContractRequirements,
  getPendingUserContractRequirements,
} from "@/lib/contract-orchestration";
import { finalizeInvitedDivinerFromSessionId } from "@/lib/invited-diviner-upgrade";
import { createClient } from "@/lib/supabase/server";
import { finalizeTraineeDivinerUpgradeFromSessionId } from "@/lib/trainee-diviner-upgrade";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pending Contracts - AstrologyPro" };

export default async function PendingContractsPage({
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

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sourceParam = resolvedSearchParams.source;
  const source = Array.isArray(sourceParam) ? sourceParam[0] : sourceParam;
  const sessionIdParam = resolvedSearchParams.session_id;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
  const nextParam = resolvedSearchParams.next;
  const nextPathRaw = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  const nextPath =
    typeof nextPathRaw === "string" &&
    nextPathRaw.startsWith("/") &&
    !nextPathRaw.startsWith("//")
      ? nextPathRaw
      : null;

  let requirements = await getPendingUserContractRequirements(user.id, "post_login");

  // Stripe can return to /contracts/pending before the webhook has finished
  // creating the new role + contract requirements. For trainee diviner
  // upgrades, re-run requirement generation once before deciding to redirect.
  if (requirements.length === 0 && source === "trainee-upgrade") {
    if (sessionId) {
      await finalizeTraineeDivinerUpgradeFromSessionId({
        userId: user.id,
        sessionId,
        markTraineePaid: true,
      });
    }
    await ensureUserContractRequirements(user.id, "post_login");
    requirements = await getPendingUserContractRequirements(user.id, "post_login");
  }

  if (requirements.length === 0 && source === "invited-diviner") {
    if (sessionId) {
      await finalizeInvitedDivinerFromSessionId({
        userId: user.id,
        sessionId,
      });
    }
    await ensureUserContractRequirements(user.id, "post_login");
    requirements = await getPendingUserContractRequirements(user.id, "post_login");
  }

  if (requirements.length === 0) {
    redirect(nextPath ?? "/switch");
  }

  return <PendingContractsClient requirements={requirements} />;
}
