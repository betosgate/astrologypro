import { redirect } from "next/navigation";

/**
 * Legacy route — Mystery School ritual builder now lives at /mystery-school/training/ritual-builder.
 * Redirect any bookmarked or cached links.
 */
export default function CommunityRitualBuilderRedirect() {
  redirect("/mystery-school/training/ritual-builder");
}
