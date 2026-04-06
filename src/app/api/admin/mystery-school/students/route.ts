import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mystery-school/students
 * Returns all mystery_school_students joined with community_members (name, email)
 * plus progress counts (foundation weeks completed, decans completed)
 * and current decan status.
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
    return NextResponse.json({ students: [] });
  }

  const studentIds = students.map((s) => s.id);
  const communityMemberIds = students
    .map((s) => s.community_member_id)
    .filter(Boolean) as string[];

  // Fetch community member details (name + email)
  const [membersRes, foundationRes, decanProgressRes] = await Promise.all([
    admin
      .from("community_members")
      .select("id, user_id, full_name, email, membership_status")
      .in(
        "id",
        communityMemberIds.length > 0
          ? communityMemberIds
          : ["00000000-0000-0000-0000-000000000000"]
      ),
    // Foundation weeks completed per student
    admin
      .from("student_foundation_progress")
      .select("student_id")
      .in("student_id", studentIds),
    // Decan progress per student
    admin
      .from("student_decan_progress")
      .select("student_id, decan_id, status")
      .in("student_id", studentIds),
  ]);

  type MemberRow = {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string;
    membership_status: string;
  };
  type FoundationRow = { student_id: string };
  type DecanProgressRow = { student_id: string; decan_id: string; status: string };

  const members = (membersRes.data ?? []) as unknown as MemberRow[];
  const foundationRows = (foundationRes.data ?? []) as unknown as FoundationRow[];
  const decanProgressRows = (decanProgressRes.data ?? []) as unknown as DecanProgressRow[];

  // Also fetch auth emails as fallback for students without community_member
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authEmailMap = new Map<string, string>(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  // Build lookup maps
  const memberByUserId = new Map(members.map((m) => [m.user_id, m]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  // Foundation weeks completed count per student_id
  const foundationCount: Record<string, number> = {};
  for (const row of foundationRows) {
    foundationCount[row.student_id] = (foundationCount[row.student_id] ?? 0) + 1;
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

  const result = students.map((s) => {
    const member = s.community_member_id
      ? memberById.get(s.community_member_id)
      : memberByUserId.get(s.user_id);

    const email = member?.email ?? authEmailMap.get(s.user_id) ?? "";
    const fullName = member?.full_name ?? "";
    const membershipStatus = member?.membership_status ?? "unknown";

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
      foundation_weeks_completed: foundationCount[s.id] ?? 0,
      decans_completed: decanCompleted[s.id] ?? 0,
      current_decan_status: decanCurrentStatus[s.id] ?? null,
    };
  });

  return NextResponse.json({ students: result });
}
