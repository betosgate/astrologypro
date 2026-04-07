import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School decans now live at /mystery-school.
 * Redirect any bookmarked or cached links.
 */
export default function CommunityDecansRedirect() {
  redirect("/mystery-school");
}
