/**
 * Mystery School Foundation → Decans transition (Training-backed path).
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v2.md
 * (Step 6 — Preserve foundation→decans transition through Training completion)
 *
 * This helper mirrors the legacy trigger that lives in
 * /api/mystery-school/foundation/complete-task/route.ts (which fires when
 * week 12's last task is checked off). The two paths run in parallel:
 *
 *   • Old path: checkbox-task completion advances training_status='decans'
 *   • New path (this file): training-lesson completion advances it too
 *
 * Both update the same column. The DB write is idempotent — guarded by
 * `.eq('training_status', 'foundation')` so a double-fire is harmless.
 *
 * Designed to be called fire-and-forget from the lesson-complete API. It
 * NEVER throws. On any unexpected error it logs and returns false so the
 * lesson completion response is unaffected.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const PROGRAM_NAME = "Mystery School Foundation";

export interface FoundationDecansTransitionResult {
  /** True if this call performed the foundation→decans UPDATE. */
  transitioned: boolean;
  /** Why the helper short-circuited, useful for logs. Null when transitioned. */
  skipReason: string | null;
}

/**
 * Checks whether the user just completed the final lesson of the Mystery
 * School Foundation program, and if so, advances mystery_school_students
 * .training_status from 'foundation' to 'decans'.
 *
 * Safe to call after every lesson completion across the platform — it
 * short-circuits cheaply when the lesson does not belong to the Mystery
 * School Foundation program.
 */
export async function maybeAdvanceMysterySchoolToDecans(
  admin: SupabaseClient,
  userId: string,
  completedLessonId: string
): Promise<FoundationDecansTransitionResult> {
  try {
    // ── 1. Find the lesson's category and program ───────────────────────────
    const { data: lessonRow } = await admin
      .from("training_lessons")
      .select("id, category_id")
      .eq("id", completedLessonId)
      .maybeSingle();

    if (!lessonRow?.category_id) {
      return { transitioned: false, skipReason: "lesson_or_category_missing" };
    }

    const { data: categoryRow } = await admin
      .from("training_categories")
      .select("id, training_id")
      .eq("id", lessonRow.category_id)
      .maybeSingle();

    if (!categoryRow?.training_id) {
      return { transitioned: false, skipReason: "category_or_program_missing" };
    }

    const { data: programRow } = await admin
      .from("training_programs")
      .select("id, name")
      .eq("id", categoryRow.training_id)
      .maybeSingle();

    if (!programRow || programRow.name !== PROGRAM_NAME) {
      // Cheap exit for the vast majority of completions across the platform.
      return { transitioned: false, skipReason: "not_mystery_school_program" };
    }

    // ── 2. Check the user is currently a Mystery School foundation student ──
    // We read by user_id (UNIQUE on mystery_school_students). If the user
    // is not enrolled, or already past 'foundation', short-circuit.
    const { data: studentRow } = await admin
      .from("mystery_school_students")
      .select("id, user_id, training_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!studentRow) {
      return { transitioned: false, skipReason: "not_enrolled" };
    }
    if (studentRow.training_status !== "foundation") {
      return { transitioned: false, skipReason: "not_in_foundation" };
    }

    // ── 3. Verify every active lesson in the program is complete ────────────
    const { data: programCategories } = await admin
      .from("training_categories")
      .select("id")
      .eq("training_id", programRow.id)
      .eq("is_active", true);

    const categoryIds = (programCategories ?? []).map((c) => c.id);
    if (categoryIds.length === 0) {
      return { transitioned: false, skipReason: "program_has_no_categories" };
    }

    const { data: programLessons } = await admin
      .from("training_lessons")
      .select("id")
      .in("category_id", categoryIds)
      .eq("is_active", true);

    const lessonIds = (programLessons ?? []).map((l) => l.id);
    if (lessonIds.length === 0) {
      return { transitioned: false, skipReason: "program_has_no_lessons" };
    }

    const { count: completedCount } = await admin
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    if ((completedCount ?? 0) < lessonIds.length) {
      return { transitioned: false, skipReason: "not_all_lessons_complete" };
    }

    // ── 4. Idempotent UPDATE — guarded by training_status='foundation' ──────
    // Two safety nets:
    //   • .eq('training_status', 'foundation') — prevents accidentally
    //     downgrading a 'graduated' student back to 'decans'.
    //   • returning .select() so we can log whether the row actually moved.
    const { data: updated, error: updateError } = await admin
      .from("mystery_school_students")
      .update({ training_status: "decans" })
      .eq("id", studentRow.id)
      .eq("training_status", "foundation")
      .select("id, training_status")
      .maybeSingle();

    if (updateError) {
      console.warn(
        "[ms-foundation-graduation] update error:",
        updateError.message
      );
      return { transitioned: false, skipReason: "update_error" };
    }

    if (!updated) {
      // Race: another path already moved this student. Idempotent no-op.
      return { transitioned: false, skipReason: "already_advanced" };
    }

    console.log(
      `[ms-foundation-graduation] student ${studentRow.id} advanced foundation→decans (lesson ${completedLessonId})`
    );
    return { transitioned: true, skipReason: null };
  } catch (err) {
    // Defensive: never let this helper throw into the lesson-complete handler.
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[ms-foundation-graduation] unexpected error:", message);
    return { transitioned: false, skipReason: "exception" };
  }
}
