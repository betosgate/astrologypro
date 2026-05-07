import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type JournalType = "scry" | "mundane";

type JournalRow = {
  journal_type: JournalType;
  id: string;
  submitted_at: string;
  student_email: string | null;
  student_name: string | null;
  decan_number: number;
  decan_title: string;
  assigned_card: string | null;
  alternate_card: string | null;
  experience_text: string | null;
  content_preview: string | null;
  relationships_section: string | null;
  business_work_section: string | null;
  shifts_perception_section: string | null;
};

type ScryJournalRecord = {
  id: string;
  student_id: string;
  decan_id: string;
  assigned_card: string | null;
  alternate_card: string | null;
  experience_text: string | null;
  content: string | null;
  submitted_at: string;
};

type MundaneJournalRecord = {
  id: string;
  student_id: string;
  decan_id: string;
  relationships_section: string | null;
  business_work_section: string | null;
  shifts_perception_section: string | null;
  content: string | null;
  submitted_at: string;
};

type StudentRecord = {
  id: string;
  user_id: string;
  community_member_id: string | null;
};

type MemberRecord = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
};

type DecanRecord = {
  id: string;
  decan_number: number;
  title: string;
};

function normalizeDateRange(dateFrom: string | null, dateTo: string | null) {
  return {
    from: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
    to: dateTo ? `${dateTo}T23:59:59.999Z` : null,
  };
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "all") as JournalType | "all";
  const decanNumberRaw = url.searchParams.get("decan_number");
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const admin = createAdminClient();
  const normalizedRange = normalizeDateRange(dateFrom, dateTo);
  const decanNumberFilter = decanNumberRaw ? parseInt(decanNumberRaw, 10) : null;

  let scryQuery = admin
    .from("scry_journals")
    .select(
      "id, student_id, decan_id, assigned_card, alternate_card, experience_text, content, submitted_at"
    )
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (normalizedRange.from) scryQuery = scryQuery.gte("submitted_at", normalizedRange.from);
  if (normalizedRange.to) scryQuery = scryQuery.lte("submitted_at", normalizedRange.to);

  let mundaneQuery = admin
    .from("mundane_journals")
    .select(
      "id, student_id, decan_id, relationships_section, business_work_section, shifts_perception_section, content, submitted_at"
    )
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (normalizedRange.from) {
    mundaneQuery = mundaneQuery.gte("submitted_at", normalizedRange.from);
  }
  if (normalizedRange.to) mundaneQuery = mundaneQuery.lte("submitted_at", normalizedRange.to);

  const [scryRes, mundaneRes] = await Promise.all([
    type === "mundane"
      ? Promise.resolve({ data: [] as ScryJournalRecord[], error: null })
      : scryQuery,
    type === "scry"
      ? Promise.resolve({ data: [] as MundaneJournalRecord[], error: null })
      : mundaneQuery,
  ]);

  if (scryRes.error) {
    return NextResponse.json({ error: scryRes.error.message }, { status: 500 });
  }
  if (mundaneRes.error) {
    return NextResponse.json({ error: mundaneRes.error.message }, { status: 500 });
  }

  const scryRows = (scryRes.data ?? []) as ScryJournalRecord[];
  const mundaneRows = (mundaneRes.data ?? []) as MundaneJournalRecord[];

  const allStudentIds = Array.from(
    new Set([...scryRows, ...mundaneRows].map((row) => row.student_id).filter(Boolean))
  );
  const allDecanIds = Array.from(
    new Set([...scryRows, ...mundaneRows].map((row) => row.decan_id).filter(Boolean))
  );

  if (allStudentIds.length === 0 || allDecanIds.length === 0) {
    return NextResponse.json([]);
  }

  const [{ data: studentRows, error: studentError }, { data: decanRows, error: decanError }] =
    await Promise.all([
      admin
        .from("mystery_school_students")
        .select("id, user_id, community_member_id")
        .in("id", allStudentIds),
      admin.from("decans").select("id, decan_number, title").in("id", allDecanIds),
    ]);

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }
  if (decanError) {
    return NextResponse.json({ error: decanError.message }, { status: 500 });
  }

  const students = (studentRows ?? []) as StudentRecord[];
  const decans = (decanRows ?? []) as DecanRecord[];

  const filteredDecanIds = decanNumberFilter
    ? new Set(
        decans
          .filter((decan) => decan.decan_number === decanNumberFilter)
          .map((decan) => decan.id)
      )
    : null;

  const communityMemberIds = Array.from(
    new Set(students.map((student) => student.community_member_id).filter(Boolean))
  ) as string[];
  const userIds = Array.from(new Set(students.map((student) => student.user_id).filter(Boolean)));

  const [{ data: memberRows, error: memberError }, authUsersRes] = await Promise.all([
    communityMemberIds.length > 0
      ? admin
          .from("community_members")
          .select("id, user_id, full_name, email")
          .in("id", communityMemberIds)
      : Promise.resolve({ data: [] as MemberRecord[], error: null }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const members = (memberRows ?? []) as MemberRecord[];
  const authEmailMap = new Map(
    (authUsersRes.data?.users ?? []).map((authUser) => [authUser.id, authUser.email ?? ""])
  );

  const studentById = new Map(students.map((student) => [student.id, student]));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const memberByUserId = new Map(members.map((member) => [member.user_id, member]));
  const decanById = new Map(decans.map((decan) => [decan.id, decan]));

  const resolveStudentIdentity = (studentId: string) => {
    const student = studentById.get(studentId);
    if (!student) {
      return { student_email: null, student_name: null };
    }

    const member = student.community_member_id
      ? memberById.get(student.community_member_id)
      : memberByUserId.get(student.user_id);

    return {
      student_email: member?.email ?? authEmailMap.get(student.user_id) ?? null,
      student_name: member?.full_name ?? null,
    };
  };

  const results: JournalRow[] = [];

  for (const row of scryRows) {
    const decan = decanById.get(row.decan_id);
    if (!decan) continue;
    if (filteredDecanIds && !filteredDecanIds.has(row.decan_id)) continue;

    const identity = resolveStudentIdentity(row.student_id);

    results.push({
      journal_type: "scry",
      id: row.id,
      submitted_at: row.submitted_at,
      student_email: identity.student_email,
      student_name: identity.student_name,
      decan_number: decan.decan_number,
      decan_title: decan.title,
      assigned_card: row.assigned_card ?? null,
      alternate_card: row.alternate_card ?? null,
      experience_text: row.experience_text ?? null,
      content_preview: (row.experience_text ?? row.content ?? "").slice(0, 150),
      relationships_section: null,
      business_work_section: null,
      shifts_perception_section: null,
    });
  }

  for (const row of mundaneRows) {
    const decan = decanById.get(row.decan_id);
    if (!decan) continue;
    if (filteredDecanIds && !filteredDecanIds.has(row.decan_id)) continue;

    const identity = resolveStudentIdentity(row.student_id);

    results.push({
      journal_type: "mundane",
      id: row.id,
      submitted_at: row.submitted_at,
      student_email: identity.student_email,
      student_name: identity.student_name,
      decan_number: decan.decan_number,
      decan_title: decan.title,
      assigned_card: null,
      alternate_card: null,
      experience_text: null,
      content_preview: (row.relationships_section ?? row.content ?? "").slice(0, 150),
      relationships_section: row.relationships_section ?? null,
      business_work_section: row.business_work_section ?? null,
      shifts_perception_section: row.shifts_perception_section ?? null,
    });
  }

  results.sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );

  return NextResponse.json(results);
}
