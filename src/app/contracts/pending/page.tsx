import { redirect } from "next/navigation";
import { PendingContractsClient } from "@/components/legal/pending-contracts-client";
import { getPendingUserContractRequirements } from "@/lib/contract-orchestration";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pending Contracts - AstrologyPro" };

export default async function PendingContractsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const requirements = await getPendingUserContractRequirements(user.id, "post_login");
  if (requirements.length === 0) {
    redirect("/switch");
  }

  return <PendingContractsClient requirements={requirements} />;
}
