import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School ritual now lives at /mystery-school/decans/[id]/ritual.
 * Redirect any bookmarked or cached links.
 */
export default async function CommunityDecanRitualRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/mystery-school/decans/${id}/ritual`);
}
