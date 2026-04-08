/**
 * Mystery School Training — Nested Layout
 *
 * Guards all /community/training/* routes.
 *
 * Access requires:
 *   - community_members.membership_type = 'mystery_school'  AND  membership_status = 'active'
 *   - mystery_school_students.status = 'active'  (or cancelled-but-within-access window)
 *
 * Non-qualifying users are redirected to /mystery-school/enroll.
 *
 * The parent /community/layout.tsx already ensures the user is authenticated
 * and has an active community_members row, so we only need to check the
 * Mystery School-specific conditions here.
 */

import { redirect } from "next/navigation";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export default async function MysterySchoolTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireMysterySchoolAccess();

  if (!result) {
    redirect("/mystery-school/enroll");
  }

  return <>{children}</>;
}
