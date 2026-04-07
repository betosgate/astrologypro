import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School training category now lives at /mystery-school/training/[categoryId].
 * Redirect any bookmarked or cached links.
 */
export default async function CommunityTrainingCategoryRedirect({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  redirect(`/mystery-school/training/${categoryId}`);
}
