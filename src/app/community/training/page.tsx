import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School training now lives at /mystery-school/training.
 * Redirect any bookmarked or cached links.
 */
export default function CommunityTrainingRedirect() {
  redirect("/mystery-school/training");
}
