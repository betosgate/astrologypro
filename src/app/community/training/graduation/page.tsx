import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School graduation now lives at /mystery-school/training/graduation.
 * Redirect any bookmarked or cached links.
 */
export default function CommunityGraduationRedirect() {
  redirect("/mystery-school/training/graduation");
}
