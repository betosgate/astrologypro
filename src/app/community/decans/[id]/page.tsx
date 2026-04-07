import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School decan detail now lives at /mystery-school/decans/[id].
 * Redirect any bookmarked or cached links.
 */
export default async function CommunityDecanDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/mystery-school/decans/${id}`);
}
