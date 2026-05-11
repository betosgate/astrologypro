import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFoundationProgressByUserId } from "@/lib/mystery-school/foundation-progress";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mystery-school/students
 *
 * Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v3.md
 *   §3 Update Mystery School Admin progress to match Training.
 *
 * Returns all mystery_school_students joined with community_members (name,
 * email) plus progress counts (foundation weeks completed, decans completed)
 * and current decan status.
 *
 * Foundation progress is now sourced from the Mystery School Foundation
 * Training program (training_categories + category_completions). When the
 * program does not exist, the legacy `student_foundation_progress` table is
 * used as a fallback so historical data is not lost.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // All mystery school students with community member info
  const { data: studentsRaw, error: studentsError } = await admin
    .from("mystery_school_students")
    .select(
      "id, user_id, enrolled_at, start_quarter, training_status, graduated_at, " +
        "community_member_id"
    )
    .order("enrolled_at", { ascending: false });

  if (studentsError)
    return NextResponse.json({ error: studentsError.message }, { status: 500 });

  type StudentRow = {
    id: string;
    user_id: string;
    enrolled_at: string;
    start_quarter: string;
    training_status: string;
    graduated_at: string | null;
    community_member_id: string | null;
  };

  const students = (studentsRaw ?? []) as unknown as StudentRow[];

  if (students.length === 0) {
    return NextResponse.json({ students: [], foundation_source: "training" });
  }

  const studentIds = students.map((s) => s.id);
  const userIds = students.map((s) => s.user_id);
  const communityMemberIds = students
    .map((s) => s.community_member_id)
    .filter(Boolean) as string[];

  // Fetch community member details (name + email), legacy foundation rows,
  // decan progress, and Training-based foundation progress in parallel.
  const [
    membersRes,
    legacyFoundationRes,
    decanProgressRes,
    trainingFoundation,
  ] = await Promise.all([
    admin
      .from("community_members")
      .select("id, user_id, full_name, email, membership_status")
      .in(
        "id",
        communityMemberIds.length > 0
          ? communityMemberIds
          : ["00000000-0000-0000-0000-000000000000"]
      ),
    // Legacy foundation rows kept as a fallback so historical data still
    // surfaces if the Training program has not been seeded yet.
    admin
      .from("student_foundation_progress")
      .select("student_id")
      .in("student_id", studentIds),
    // Decan progress per student
    admin
      .from("student_decan_progress")
      .select("student_id, decan_id, status")
      .in("student_id", studentIds),
    // Training-backed Foundation progress per user_id (source of truth).
    getFoundationProgressByUserId(admin, userIds),
  ]);

  type MemberRow = {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string;
    membership_status: string;
  };
  type LegacyFoundationRow = { student_id: string };
  type DecanProgressRow = { student_id: string; decan_id: string; status: string };

  const members = (membersRes.data ?? []) as unknown as MemberRow[];
  const legacyFoundationRows = (legacyFoundationRes.data ??
    []) as unknown as LegacyFoundationRow[];
  const decanProgressRows = (decanProgressRes.data ?? []) as unknown as DecanProgressRow[];

  // Also fetch auth emails as fallback for students without community_member
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authEmailMap = new Map<string, string>(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  // Build lookup maps
  const memberByUserId = new Map(members.map((m) => [m.user_id, m]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  // Legacy weeks-completed count per student_id (used only if Training
  // program is absent for the v3 transition window).
  const legacyFoundationCount: Record<string, number> = {};
  for (const row of legacyFoundationRows) {
    legacyFoundationCount[row.student_id] =
      (legacyFoundationCount[row.student_id] ?? 0) + 1;
  }

  // Decan counts per student_id
  const decanCompleted: Record<string, number> = {};
  const decanCurrentStatus: Record<string, string | null> = {};
  for (const row of decanProgressRows) {
    if (row.status === "completed") {
      decanCompleted[row.student_id] = (decanCompleted[row.student_id] ?? 0) + 1;
    }
    if (row.status === "active" || row.status === "grace") {
      decanCurrentStatus[row.student_id] = row.status;
    }
  }

  const trainingProgramPresent = trainingFoundation.shape.program_present;
  const trainingByUserId = trainingFoundation.byUserId;

  const result = students.map((s) => {
    const member = s.community_member_id
      ? memberById.get(s.community_member_id)
      : memberByUserId.get(s.user_id);

    const email = member?.email ?? authEmailMap.get(s.user_id) ?? "";
    const fullName = member?.full_name ?? "";
    const membershipStatus = member?.membership_status ?? "unknown";

    const trainingProgress = trainingByUserId.get(s.user_id);
    const trainingWeeks = trainingProgress?.weeks_completed ?? 0;
    const trainingLessons = trainingProgress?.lessons_completed ?? 0;

    // Source of truth = Training. Legacy count is fallback only.
    const foundationWeeksCompleted = trainingProgramPresent
      ? trainingWeeks
      : legacyFoundationCount[s.id] ?? 0;

    // Sprint 2026-05-06: derive the phase badge from Admin Training-backed
    // Foundation completion so the admin list never shows `Decans` for a
    // student who hasn't actually finished Foundation.
    //   • Use the same lessons-or-category-completion rule by comparing
    //     against the program's active week count.
    //   • Already-graduated students always badge as `Graduated`.
    //   • If DB training_status disagrees with derived phase, surface a
    //     `phase_mismatch` flag the UI can render as a secondary badge.
    const totalWeeks = trainingFoundation.shape.categories.length;
    const foundationCompleteDerived =
      trainingProgramPresent &&
      totalWeeks > 0 &&
      foundationWeeksCompleted >= totalWeeks;
    const isGraduated =
      !!s.graduated_at || s.training_status === "graduated";
    const derivedPhase: "graduated" | "decans" | "foundation" = isGraduated
      ? "graduated"
      : foundationCompleteDerived
        ? "decans"
        : "foundation";
    const phaseMismatch =
      !isGraduated &&
      s.training_status === "decans" &&
      !foundationCompleteDerived;

    return {
      id: s.id,
      user_id: s.user_id,
      email,
      full_name: fullName,
      enrolled_at: s.enrolled_at,
      start_quarter: s.start_quarter,
      training_status: s.training_status,
      graduated_at: s.graduated_at ?? null,
      membership_status: membershipStatus,
      foundation_weeks_completed: foundationWeeksCompleted,
      foundation_lessons_completed: trainingLessons,
      foundation_source: trainingProgramPresent ? "training" : "legacy",
      foundation_complete_derived: foundationCompleteDerived,
      derived_phase: derivedPhase,
      phase_mismatch: phaseMismatch,
      decans_completed: decanCompleted[s.id] ?? 0,
      current_decan_status: decanCurrentStatus[s.id] ?? null,
    };
  });

  // `In Decan Year` summary uses the derived phase, so a student stuck on
  // training_status='decans' with stale Foundation progress doesn't get
  // counted.
  const inDecanYearCount = result.filter((r) => r.derived_phase === "decans").length;
  const graduatedCount = result.filter((r) => r.derived_phase === "graduated").length;
  const foundationCount = result.filter((r) => r.derived_phase === "foundation").length;

  return NextResponse.json({
    students: result,
    foundation_source: trainingProgramPresent ? "training" : "legacy",
    foundation_total_weeks: trainingFoundation.shape.categories.length || 12,
    summary: {
      in_decan_year: inDecanYearCount,
      graduated: graduatedCount,
      foundation: foundationCount,
    },
  });
}
