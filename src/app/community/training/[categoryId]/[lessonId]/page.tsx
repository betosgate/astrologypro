import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School lesson now lives at /mystery-school/training/[categoryId]/[lessonId].
 * Redirect any bookmarked or cached links.
 */
export default async function CommunityTrainingLessonRedirect({
  params,
}: {
  params: Promise<{ categoryId: string; lessonId: string }>;
}) {
  const { categoryId, lessonId } = await params;
  redirect(`/mystery-school/training/${categoryId}/${lessonId}`);
}
