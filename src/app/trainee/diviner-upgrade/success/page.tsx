import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finalizeTraineeDivinerUpgradeFromSessionId } from "@/lib/trainee-diviner-upgrade";

export const dynamic = "force-dynamic";

export default async function TraineeDivinerUpgradeSuccessPage({
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
  const sessionIdParam = resolvedSearchParams.session_id;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;

  if (!sessionId) {
    redirect("/trainee?upgrade=missing-session");
  }

  const result = await finalizeTraineeDivinerUpgradeFromSessionId({
    sessionId,
    userId: user.id,
    markTraineePaid: true,
    ensureContracts: true,
  });

  console.log("result ------------ 123",result);
  

  if (!result?.divinerSaved) {
    redirect("/trainee?upgrade=provision-failed");
  }

  redirect(`/contracts/pending?source=trainee-upgrade&session_id=${encodeURIComponent(sessionId)}`);
}
