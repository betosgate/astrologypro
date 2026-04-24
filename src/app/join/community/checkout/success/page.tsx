import { redirect } from "next/navigation";
import { finalizePerennialCommunityCheckoutFromSessionId } from "@/lib/community/finalize-checkout";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finalizing Perennial Mandalism - AstrologyPro" };

export default async function CommunityCheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionIdParam = resolvedSearchParams.session_id;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
  const loginRedirect = `/join/community/checkout/success${
    sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""
  }`;

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
  }

  if (!sessionId) {
    redirect("/switch?pm=missing-session");
  }

  const result = await finalizePerennialCommunityCheckoutFromSessionId({
    sessionId,
    userId: user.id,
    ensureContracts: true,
  });

  if (!result?.communityMemberSaved) {
    redirect("/switch?subscribed=true&pm=provision-failed");
  }

  redirect("/community");
}
