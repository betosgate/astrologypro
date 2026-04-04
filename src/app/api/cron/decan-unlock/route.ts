import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/decan-unlock
 * Runs daily. For each active mystery school student:
 *   - Unlocks decans whose start date is within 7 days (status: upcoming → active)
 *   - Marks grace-period-expired decans as missed (end_date + 2 days passed, not completed)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();

  // All 36 decans
  const { data: decans } = await admin
    .from("decans")
    .select("id, decan_number, start_month, start_day, end_month, end_day");

  // All active mystery school students
  const { data: students } = await admin
    .from("mystery_school_students")
    .select("id, training_status")
    .eq("training_status", "decans");

  if (!decans || !students) {
    return NextResponse.json({ unlocked: 0, missed: 0 });
  }

  let unlocked = 0;
  let missed = 0;

  function decanDates(d: { start_month: number; start_day: number; end_month: number; end_day: number }) {
    // Handle Capricorn I which crosses year boundary (Dec 22 – Dec 31)
    const startYear = currentYear;
    const endYear = d.start_month === 12 && d.end_month === 1 ? currentYear + 1 : currentYear;
    const start = new Date(startYear, d.start_month - 1, d.start_day);
    const end = new Date(endYear, d.end_month - 1, d.end_day, 23, 59, 59);
    return { start, end };
  }

  for (const student of students) {
    for (const decan of decans) {
      const { start, end } = decanDates(decan);
      const sevenDaysBefore = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      const graceEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

      // Check existing progress
      const { data: progress } = await admin
        .from("student_decan_progress")
        .select("status, ritual_done, scry_done, journal_done, unlocked_at")
        .eq("student_id", student.id)
        .eq("decan_id", decan.id)
        .single();

      const progressTyped = progress as unknown as {
        status: string;
        ritual_done: boolean;
        scry_done: boolean;
        journal_done: boolean;
        unlocked_at: string | null;
      } | null;

      // Unlock: 7 days before start, move to "upcoming"
      if (now >= sevenDaysBefore && now < start) {
        if (!progressTyped || progressTyped.status === "locked") {
          await admin
            .from("student_decan_progress")
            .upsert(
              {
                student_id: student.id,
                decan_id: decan.id,
                status: "upcoming",
                unlocked_at: now.toISOString(),
                updated_at: now.toISOString(),
              },
              { onConflict: "student_id,decan_id" }
            );
          unlocked++;
        }
      }

      // Activate: decan has started
      if (now >= start && now <= end) {
        if (!progressTyped || progressTyped.status === "upcoming" || progressTyped.status === "locked") {
          await admin
            .from("student_decan_progress")
            .upsert(
              {
                student_id: student.id,
                decan_id: decan.id,
                status: "active",
                unlocked_at: progressTyped?.unlocked_at ?? now.toISOString(),
                updated_at: now.toISOString(),
              },
              { onConflict: "student_id,decan_id" }
            );
          unlocked++;
        }
      }

      // Miss: grace period expired, not completed
      if (now > graceEnd && progressTyped && progressTyped.status === "active") {
        const allDone = progressTyped.ritual_done && progressTyped.scry_done && progressTyped.journal_done;
        if (!allDone) {
          await admin
            .from("student_decan_progress")
            .update({ status: "missed", missed_at: now.toISOString(), updated_at: now.toISOString() })
            .eq("student_id", student.id)
            .eq("decan_id", decan.id);
          missed++;
        }
      }
    }
  }

  console.log(`[decan-unlock] unlocked=${unlocked} missed=${missed}`);
  return NextResponse.json({ unlocked, missed });
}
