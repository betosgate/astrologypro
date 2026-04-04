import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decans
 * Returns all 36 decans with the student's progress status for each.
 * Decans the student has not yet been provisioned get status "locked" implicitly.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member || member.membership_type !== "mystery_school" || member.membership_status !== "active") {
    return NextResponse.json({ error: "Mystery School membership required" }, { status: 403 });
  }

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id, training_status, start_quarter, enrolled_at")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  // All 36 decans
  const { data: decans, error: decansError } = await supabase
    .from("decans")
    .select("id, decan_number, sign, planet, title, start_month, start_day, end_month, end_day, description")
    .order("decan_number");

  if (decansError) return NextResponse.json({ error: decansError.message }, { status: 500 });

  // Student's progress records
  const { data: progress } = await supabase
    .from("student_decan_progress")
    .select("decan_id, status, ritual_done, scry_done, journal_done, unlocked_at, completed_at, missed_at")
    .eq("student_id", student.id);

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.decan_id, p])
  );

  const now = new Date();
  const currentYear = now.getFullYear();

  function getDecanDateRange(decan: { start_month: number; start_day: number; end_month: number; end_day: number }) {
    // Determine year for Capricorn (crosses year boundary)
    const startYear = decan.start_month === 12 && decan.end_month === 1 ? currentYear : currentYear;
    const endYear = decan.start_month === 12 && decan.end_month === 1 ? currentYear + 1 : currentYear;
    const start = new Date(startYear, decan.start_month - 1, decan.start_day);
    const end = new Date(endYear, decan.end_month - 1, decan.end_day, 23, 59, 59);
    return { start, end };
  }

  const decansWithStatus = (decans ?? []).map((decan) => {
    const p = progressMap.get(decan.id);
    const { start, end } = getDecanDateRange(decan);
    const graceEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

    let computedStatus: string = p?.status ?? "locked";

    // Override status based on current date if no progress record exists
    if (!p) {
      const sevenDaysBefore = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (now >= start && now <= graceEnd) computedStatus = "upcoming";
      else if (now >= sevenDaysBefore && now < start) computedStatus = "upcoming";
    }

    return {
      ...decan,
      status: computedStatus,
      ritualDone: p?.ritual_done ?? false,
      scryDone: p?.scry_done ?? false,
      journalDone: p?.journal_done ?? false,
      unlockedAt: p?.unlocked_at ?? null,
      completedAt: p?.completed_at ?? null,
      missedAt: p?.missed_at ?? null,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        graceEnd: graceEnd.toISOString(),
      },
    };
  });

  const completedCount = decansWithStatus.filter((d) => d.status === "completed").length;
  const activeDecan = decansWithStatus.find((d) => d.status === "active");

  return NextResponse.json({
    student: {
      id: student.id,
      trainingStatus: student.training_status,
      startQuarter: student.start_quarter,
    },
    decans: decansWithStatus,
    completedCount,
    totalDecans: 36,
    activeDecan: activeDecan ?? null,
  });
}
