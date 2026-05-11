import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadFoundationProgramShape,
  MYSTERY_SCHOOL_FOUNDATION_PROGRAM_NAME,
} from "@/lib/mystery-school/foundation-progress";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mystery-school/training-status
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v3.md
 *   §4 De-emphasize legacy Foundation editing in /admin/mystery-school.
 *   §5 Ensure 12-week content exists.
 *
 * Returns a status snapshot the admin Mystery School page renders to direct
 * admins to Admin Training for Foundation curriculum work, and to flag any
 * weeks that do not yet have an active lesson.
 *
 *   {
 *     program_present: boolean,
 *     program: { id, name } | null,
 *     expected_weeks: 12,
 *     active_week_count: number,
 *     weeks_missing_lessons: number,
 *     weeks: [
 *       { id, name, priority, is_active, active_lesson_count }
 *     ],
 *     links: { programs, categories, lessons, quizzes }
 *   }
 *
 * The endpoint never throws; if the Training program is missing it returns
 * `program_present: false` so the admin UI can render a clear setup CTA.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const shape = await loadFoundationProgramShape(admin);

  const expectedWeeks = 12;
  const activeWeekCount = shape.categories.length;
  const weeksMissingLessons = shape.categories.filter(
    (c) => c.active_lesson_count === 0
  ).length;

  return NextResponse.json({
    program_name: MYSTERY_SCHOOL_FOUNDATION_PROGRAM_NAME,
    program_present: shape.program_present,
    program: shape.program_present
      ? { id: shape.program_id, name: shape.program_name }
      : null,
    expected_weeks: expectedWeeks,
    active_week_count: activeWeekCount,
    weeks_missing_lessons: weeksMissingLessons,
    weeks: shape.categories,
    links: {
      programs: "/admin/training/programs",
      categories: "/admin/training/categories",
      lessons: "/admin/training/lessons",
      quizzes: "/admin/training/quizzes",
    },
  });
}
