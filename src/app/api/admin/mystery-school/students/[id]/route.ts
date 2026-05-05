import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFoundationWeekTimelineForUser } from "@/lib/mystery-school/foundation-progress";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mystery-school/students/[id]
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v3.md
 *   §3 Update Mystery School Admin progress to match Training.
 *
 * Returns full student detail for the admin view:
 *   - mystery_school_students row
 *   - community_members name/email
 *   - All 36 student_decan_progress rows (with retry and excuse fields)
 *   - Foundation progress, derived from the Mystery School Foundation
 *     Training program (training_categories + category_completions +
 *     lesson_completions). Legacy student_foundation_progress is kept as a
 *     fallback when the Training program is absent.
 *   - Graduation eligibility: count of unexcused missed decans
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const admin = createAdminClient();

  // Fetch the student row
  const { data: studentRaw, error: studentError } = await admin
    .from("mystery_school_students")
    .select(
      "id, user_id, enrolled_at, start_quarter, training_status, graduated_at, community_member_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  type StudentRow = {
    id: string;
    user_id: string;
    enrolled_at: string;
    start_quarter: string;
    training_status: string;
    graduated_at: string | null;
    community_member_id: string | null;
  };

  const student = studentRaw as unknown as StudentRow | null;
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Parallel fetches.
  // Foundation progress is read from Training tables via the helper (source
  // of truth in v3). The legacy student_foundation_progress query is kept
  // for fallback display when Training is not yet populated.
  const [
    memberRes,
    decanProgressRes,
    legacyFoundationRes,
    authUsersRes,
    trainingTimeline,
  ] = await Promise.all([
    student.community_member_id
      ? admin
          .from("community_members")
          .select("id, user_id, full_name, email, membership_status")
          .eq("id", student.community_member_id)
          .maybeSingle()
      : admin
          .from("community_members")
          .select("id, user_id, full_name, email, membership_status")
          .eq("user_id", student.user_id)
          .maybeSingle(),

    admin
      .from("student_decan_progress")
      .select(
        "id, decan_id, status, ritual_done, scry_done, journal_done, " +
          "unlocked_at, completed_at, missed_at, " +
          "window_open, window_close, grace_close, " +
          "retry_year, retry_window_open, retry_window_close, " +
          "admin_excused, admin_excused_at, admin_excused_by, " +
          "excuse_reason, excused_at, excused_by, " +
          "created_at, updated_at"
      )
      .eq("student_id", id),

    admin
      .from("student_foundation_progress")
      .select("id, week_number, completed_at, week_completed_at, task_completions")
      .eq("student_id", id)
      .order("week_number"),

    admin.auth.admin.listUsers({ perPage: 1000 }),

    getFoundationWeekTimelineForUser(admin, student.user_id),
  ]);

  type MemberRow = {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string;
    membership_status: string;
  };

  type DecanProgressRow = {
    id: string;
    decan_id: string;
    status: string;
    ritual_done: boolean;
    scry_done: boolean;
    journal_done: boolean;
    unlocked_at: string | null;
    completed_at: string | null;
    missed_at: string | null;
    window_open: string | null;
    window_close: string | null;
    grace_close: string | null;
    retry_year: number | null;
    retry_window_open: string | null;
    retry_window_close: string | null;
    admin_excused: boolean;
    admin_excused_at: string | null;
    admin_excused_by: string | null;
    excuse_reason: string | null;
    excused_at: string | null;
    excused_by: string | null;
    created_at: string;
    updated_at: string;
  };

  type LegacyFoundationProgressRow = {
    id: string;
    week_number: number;
    completed_at: string | null;
    week_completed_at: string | null;
    task_completions: Record<string, { completed_at: string }>;
  };

  const member = memberRes.data as unknown as MemberRow | null;
  const decanProgressRows = (decanProgressRes.data ?? []) as unknown as DecanProgressRow[];
  const legacyFoundationRows = (legacyFoundationRes.data ??
    []) as unknown as LegacyFoundationProgressRow[];
  const authUsers = authUsersRes.data?.users ?? [];

  // Build auth email map for admin name display
  const authEmailMap = new Map<string, string>(
    authUsers.map((u) => [u.id, u.email ?? ""])
  );

  // Resolve email/name
  const email = member?.email ?? authEmailMap.get(student.user_id) ?? "";
  const fullName = member?.full_name ?? "";
  const membershipStatus = member?.membership_status ?? "unknown";

  // Enrich decan progress with excused-by admin email
  const decanProgress = decanProgressRows.map((row) => ({
    ...row,
    excused_by_email: row.excused_by ? (authEmailMap.get(row.excused_by) ?? null) : null,
  }));

  // Compute graduation eligibility
  const unexcusedMissedCount = decanProgress.filter(
    (r) => r.status === "missed" && !r.admin_excused
  ).length;
  const completedCount = decanProgress.filter((r) => r.status === "completed").length;
  const graduationEligible = completedCount === 36 && unexcusedMissedCount === 0;

  // ── Foundation summary (Training-backed when available) ─────────────────
  const trainingProgramPresent = trainingTimeline.shape.program_present;

  // Training-derived metrics: a "complete" week is either category_completions
  // having a row OR every active lesson in that category being complete.
  const trainingWeeksCompleted = trainingTimeline.weeks.filter(
    (w) => w.completed
  ).length;
  const trainingLessonsCompleted = trainingTimeline.weeks.reduce(
    (sum, w) => sum + w.lessons_completed,
    0
  );
  const trainingTotalWeeks = trainingTimeline.weeks.length;

  // Legacy fallback metrics (only used when the Training program is absent).
  const legacyWeeksCompleted = legacyFoundationRows.length;
  const legacyTasksCompleted = legacyFoundationRows.reduce((sum, row) => {
    return sum + Object.keys(row.task_completions ?? {}).length;
  }, 0);

  const foundationSource: "training" | "legacy" = trainingProgramPresent
    ? "training"
    : "legacy";

  return NextResponse.json({
    student: {
      id: student.id,
      user_id: student.user_id,
      email,
      full_name: fullName,
      membership_status: membershipStatus,
      enrolled_at: student.enrolled_at,
      start_quarter: student.start_quarter,
      training_status: student.training_status,
      graduated_at: student.graduated_at ?? null,
    },
    decan_progress: decanProgress,
    foundation_progress: {
      source: foundationSource,
      // Unified counters used by the admin UI. These mirror the learner
      // overview when Training is the source of truth.
      weeks_completed: trainingProgramPresent
        ? trainingWeeksCompleted
        : legacyWeeksCompleted,
      total_weeks: trainingProgramPresent ? trainingTotalWeeks : 12,
      lessons_completed: trainingProgramPresent
        ? trainingLessonsCompleted
        : legacyTasksCompleted,
      // Kept for backward compatibility with existing UI label.
      total_tasks_completed: trainingProgramPresent
        ? trainingLessonsCompleted
        : legacyTasksCompleted,
      // Detailed per-week breakdown from Training; empty array if program
      // not present (UI should fall back to legacy_rows).
      weeks: trainingTimeline.weeks,
      // Legacy rows preserved so the admin can see historical task data
      // even after the cutover.
      legacy_rows: legacyFoundationRows,
      // Backward-compat alias used by the existing student detail page.
      rows: legacyFoundationRows,
    },
    graduation: {
      eligible: graduationEligible,
      completed_count: completedCount,
      unexcused_missed_count: unexcusedMissedCount,
    },
  });
}
