import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertMysterySchoolDecanEligible } from "./foundation-progress";
import { maybeAdvanceMysterySchoolToDecans } from "./foundation-graduation";

/**
 * Server-side eligibility gate for every Decan API route. Returns either:
 *   • a `NextResponse` (403 Problem-shaped) the route should return as-is
 *     when the student isn't Decan-eligible, or
 *   • `null` when the student may proceed.
 *
 * On the boundary case where Foundation is now complete but the row is
 * still in 'foundation', this helper fires the (idempotent) Mystery
 * School advance fire-and-forget so the next request short-circuits via
 * `training_status='decans'`.
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-foundation-decan-access-flow.md
 */
export async function requireDecanEligibilityOr403(
  admin: SupabaseClient,
  userId: string,
): Promise<NextResponse | null> {
  const eligibility = await assertMysterySchoolDecanEligible(admin, userId);
  if (eligibility.eligible) {
    if (eligibility.reason === "foundation_complete") {
      // Boundary case — advance the row idempotently so the next request
      // short-circuits via `training_status='decans'`.
      maybeAdvanceMysterySchoolToDecans(admin, userId, null).catch((err) =>
        console.warn(
          "[decan-gate] maybeAdvanceMysterySchoolToDecans failed",
          err instanceof Error ? err.message : String(err),
        ),
      );
    }
    return null;
  }
  return NextResponse.json(
    {
      error: "Complete Foundation Training before starting Decan work.",
      code: "foundation_required",
      foundation: {
        completedWeeks: eligibility.foundation.completedWeeks,
        totalWeeks: eligibility.foundation.totalWeeks,
        completedLessons: eligibility.foundation.completedLessons,
        totalLessons: eligibility.foundation.totalLessons,
      },
    },
    { status: 403 },
  );
}
