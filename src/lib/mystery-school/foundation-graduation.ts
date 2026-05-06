/**
 * Mystery School Foundation → Decans transition (Training-backed path).
 *
 * Spec:
 *   docs/tasks/2026-04-30/mystery-school-admin-training-unification-v2.md
 *     (Step 6 — Preserve foundation→decans transition through Training)
 *   docs/tasks/2026-05-06/mystery-school-foundation-decan-access-flow.md
 *     (refactored to share `getFoundationCompletionForUser` so learner UI,
 *      admin badges, graduation, and decan gating cannot drift)
 *
 * Designed to be called fire-and-forget from the lesson-complete API. It
 * NEVER throws. On any unexpected error it logs and returns
 * `transitioned: false` so the lesson completion response is unaffected.
 *
 * Idempotent — guarded by `.eq('training_status', 'foundation')` so a
 * double-fire is harmless.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getFoundationCompletionForUser,
  MYSTERY_SCHOOL_FOUNDATION_PROGRAM_NAME,
} from "./foundation-progress";

export interface FoundationDecansTransitionResult {
  /** True if this call performed the foundation→decans UPDATE. */
  transitioned: boolean;
  /** Why the helper short-circuited, useful for logs. Null when transitioned. */
  skipReason: string | null;
}

/**
 * Checks whether the user just completed the final lesson of the Mystery
 * School Foundation program, and if so, advances mystery_school_students
 * .training_status from 'foundation' to 'decans' (and stamps
 * foundation_completed_at).
 *
 * Safe to call after every lesson completion across the platform — it
 * short-circuits cheaply when the lesson does not belong to the Mystery
 * School Foundation program.
 *
 * `completedLessonId` is optional. When supplied we use it for a cheap
 * "is this even a Mystery School lesson?" pre-check so this helper stays
 * cheap to call from the global lesson-complete handler. Pass `null` from
 * trigger-only completion paths or from idempotency back-fills where the
 * lesson identity isn't known.
 */
export async function maybeAdvanceMysterySchoolToDecans(
  admin: SupabaseClient,
  userId: string,
  completedLessonId: string | null,
): Promise<FoundationDecansTransitionResult> {
  try {
    // ── 1. Cheap exit when we know the lesson is unrelated ──────────────────
    if (completedLessonId) {
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
      if (
        !programRow ||
        (programRow as { name?: string }).name !==
          MYSTERY_SCHOOL_FOUNDATION_PROGRAM_NAME
      ) {
        return { transitioned: false, skipReason: "not_mystery_school_program" };
      }
    }

    // ── 2. Check the user is currently a Mystery School foundation student ──
    const { data: studentRow } = await admin
      .from("mystery_school_students")
      .select("id, user_id, training_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!studentRow) {
      return { transitioned: false, skipReason: "not_enrolled" };
    }
    if ((studentRow as { training_status?: string }).training_status !== "foundation") {
      return { transitioned: false, skipReason: "not_in_foundation" };
    }

    // ── 3. Verify Foundation is fully complete via shared helper ────────────
    const completion = await getFoundationCompletionForUser(admin, userId);
    if (completion.totalWeeks === 0) {
      return { transitioned: false, skipReason: "program_has_no_categories" };
    }
    if (completion.totalLessons === 0) {
      return { transitioned: false, skipReason: "program_has_no_lessons" };
    }
    if (!completion.isComplete) {
      return { transitioned: false, skipReason: "not_all_lessons_complete" };
    }

    // ── 4. Idempotent UPDATE — guarded by training_status='foundation' ──────
    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("mystery_school_students")
      .update({
        training_status: "decans",
        foundation_completed_at: nowIso,
      })
      .eq("id", (studentRow as { id: string }).id)
      .eq("training_status", "foundation")
      .select("id, training_status")
      .maybeSingle();

    if (updateError) {
      console.warn(
        "[ms-foundation-graduation] update error:",
        updateError.message,
      );
      return { transitioned: false, skipReason: "update_error" };
    }

    if (!updated) {
      // Race: another path already moved this student. Idempotent no-op.
      return { transitioned: false, skipReason: "already_advanced" };
    }

    console.log(
      `[ms-foundation-graduation] student ${(studentRow as { id: string }).id} advanced foundation→decans` +
        (completedLessonId ? ` (lesson ${completedLessonId})` : ""),
    );
    return { transitioned: true, skipReason: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[ms-foundation-graduation] unexpected error:", message);
    return { transitioned: false, skipReason: "exception" };
  }
}
