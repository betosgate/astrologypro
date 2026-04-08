/**
 * Mystery School Training — Nested Layout
 *
 * Guards all /mystery-school/training/* routes.
 *
 * Access requires an active Mystery School entitlement via
 * mystery_school_students. Legacy users still stored only in
 * community_members are provisioned on demand by requireMysterySchoolAccess().
 *
 * Non-qualifying users are redirected to /mystery-school/enroll.
 *
 * The parent /mystery-school/layout.tsx already ensures the user is authenticated
 * and has valid Mystery School access.
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
