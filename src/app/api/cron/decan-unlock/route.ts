import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/decan-unlock
 * Runs daily. For each active mystery school student:
 *
 *   1. PREVIEW  — 7 days before window_open:
 *      locked → preview (upsert with window dates)
 *
 *   2. ACTIVATE — window_open reached:
 *      preview/upcoming/locked → active
 *      Persists window_open, window_close, grace_close on the progress row.
 *
 *   3. GRACE    — window_close passed, not completed:
 *      active → grace (persist grace_close = window_close + 2 days)
 *
 *   4. MISSED   — grace_close passed, not completed:
 *      grace/active → missed
 *      Persists missed_at, retry_year, retry_window_open, retry_window_close.
 *
 *   5. RETRY REOPEN — retry_window_open reached for a missed decan:
 *      missed → active (using retry window dates)
 *
 * Completed decans are never touched.
 * Admin-excused decans are never touched.
 *
 * Graduation gate: a student with ANY unexcused missed decan is NOT graduated.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const now = new Date();
  const currentYear = now.getFullYear();

  // All 36 decans
  const { data: decans } = await admin
    .from("decans")
    .select("id, decan_number, start_month, start_day, end_month, end_day");

  // All mystery school students in foundation or decans training phase
  const { data: students } = await admin
    .from("mystery_school_students")
    .select("id, training_status")
    .in("training_status", ["foundation", "decans"]);

  if (!decans || !students) {
    return NextResponse.json({ previewed: 0, unlocked: 0, graced: 0, missed: 0, retried: 0 });
  }

  /**
   * Compute canonical window dates for a decan using seeded month/day values.
   * Capricorn I (start_month=12, end_month=12): both in current year.
   * Capricorn II/III (start_month=1): standard current year.
   * The only cross-year case is a decan whose start is Dec and end is Jan.
   */
  function decanDates(d: {
    start_month: number;
    start_day: number;
    end_month: number;
    end_day: number;
  }, year: number = currentYear) {
    const crossesYear = d.start_month === 12 && d.end_month !== 12;
    // Use Date.UTC so the window boundaries are not skewed by the
    // server's local timezone (Vercel runs in UTC; running locally in a
    // non-UTC zone would otherwise drift the boundaries by hours).
    const windowOpen = new Date(
      Date.UTC(year, d.start_month - 1, d.start_day, 0, 0, 0)
    );
    const windowClose = new Date(
      Date.UTC(
        crossesYear ? year + 1 : year,
        d.end_month - 1,
        d.end_day,
        23, 59, 59
      )
    );
    const graceClose = new Date(windowClose.getTime() + 2 * 24 * 60 * 60 * 1000);
    const previewOpen = new Date(windowOpen.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { windowOpen, windowClose, graceClose, previewOpen };
  }

  /**
   * Compute the retry year for a missed decan.
   * If the decan falls in Q4 (months 10–12) of the current year, retry in +5 years
   * (long cycle). Otherwise retry in current year + 1.
   */
  function computeRetryYear(
    decan: { start_month: number },
    missedYear: number
  ): number {
    const isLastQuarter = decan.start_month >= 10;
    return missedYear + (isLastQuarter ? 5 : 1);
  }

  let previewed = 0;
  let unlocked = 0;
  let graced = 0;
  let missed = 0;
  let retried = 0;

  for (const student of students) {
    for (const decan of decans) {
      const { windowOpen, windowClose, graceClose, previewOpen } = decanDates(decan);

      // Fetch existing progress row (if any)
      const { data: rawProgress } = await admin
        .from("student_decan_progress")
        .select(
          "id, status, ritual_done, scry_done, journal_done, unlocked_at, " +
            "window_open, window_close, grace_close, admin_excused, " +
            "missed_at, retry_window_open, retry_window_close, retry_year"
        )
        .eq("student_id", student.id)
        .eq("decan_id", decan.id)
        .maybeSingle();

      const progress = rawProgress as {
        id: string;
        status: string;
        ritual_done: boolean;
        scry_done: boolean;
        journal_done: boolean;
        unlocked_at: string | null;
        window_open: string | null;
        window_close: string | null;
        grace_close: string | null;
        admin_excused: boolean;
        missed_at: string | null;
        retry_window_open: string | null;
        retry_window_close: string | null;
        retry_year: number | null;
      } | null;

      // Never touch completed or admin-excused rows
      if (progress?.status === "completed") continue;
      if (progress?.admin_excused === true) continue;

      const currentStatus = progress?.status ?? "locked";

      // Use persisted window dates if available (set at activation time)
      const effectiveWindowClose = progress?.window_close
        ? new Date(progress.window_close)
        : windowClose;
      const effectiveGraceClose = progress?.grace_close
        ? new Date(progress.grace_close)
        : graceClose;

      // ── 5. RETRY REOPEN — missed decan whose retry window has opened ──────
      if (
        currentStatus === "missed" &&
        progress?.retry_window_open &&
        progress?.retry_window_close
      ) {
        const retryOpen = new Date(progress.retry_window_open);
        const retryClose = new Date(progress.retry_window_close);
        if (now >= retryOpen && now <= retryClose) {
          await admin
            .from("student_decan_progress")
            .update({
              status: "active",
              window_open: retryOpen.toISOString(),
              window_close: retryClose.toISOString(),
              grace_close: new Date(retryClose.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              unlocked_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("student_id", student.id)
            .eq("decan_id", decan.id);
          retried++;
          continue;
        }
        // Retry window hasn't opened yet — skip all other checks for this missed decan
        continue;
      }

      // ── 1. MISSED — grace_close has passed, not completed ──────────────────
      if (
        now > effectiveGraceClose &&
        (currentStatus === "grace" || currentStatus === "active")
      ) {
        const allDone =
          (progress?.ritual_done ?? false) &&
          (progress?.scry_done ?? false) &&
          (progress?.journal_done ?? false);
        if (!allDone) {
          // Compute retry window for next eligible year
          const missedYear = effectiveGraceClose.getFullYear();
          const retryYear = computeRetryYear(decan, missedYear);
          const retryDates = decanDates(decan, retryYear);

          await admin
            .from("student_decan_progress")
            .update({
              status: "missed",
              missed_at: now.toISOString(),
              retry_year: retryYear,
              retry_window_open: retryDates.windowOpen.toISOString(),
              retry_window_close: retryDates.graceClose.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("student_id", student.id)
            .eq("decan_id", decan.id);
          missed++;
        }
        continue;
      }

      // ── 2. GRACE — window_close passed, not completed ──────────────────────
      if (
        now > effectiveWindowClose &&
        now <= effectiveGraceClose &&
        currentStatus === "active"
      ) {
        const allDone =
          (progress?.ritual_done ?? false) &&
          (progress?.scry_done ?? false) &&
          (progress?.journal_done ?? false);
        if (!allDone) {
          await admin
            .from("student_decan_progress")
            .update({
              status: "grace",
              grace_close: effectiveGraceClose.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("student_id", student.id)
            .eq("decan_id", decan.id);
          graced++;
        }
        continue;
      }

      // ── 3. ACTIVATE — window has opened ────────────────────────────────────
      if (
        now >= windowOpen &&
        now <= windowClose &&
        (currentStatus === "locked" ||
          currentStatus === "upcoming" ||
          currentStatus === "preview")
      ) {
        await admin
          .from("student_decan_progress")
          .upsert(
            {
              student_id: student.id,
              decan_id: decan.id,
              status: "active",
              unlocked_at: progress?.unlocked_at ?? now.toISOString(),
              window_open: windowOpen.toISOString(),
              window_close: windowClose.toISOString(),
              grace_close: graceClose.toISOString(),
              updated_at: now.toISOString(),
            },
            { onConflict: "student_id,decan_id" }
          );
        unlocked++;
        continue;
      }

      // ── 4. PREVIEW — 7 days before window opens ────────────────────────────
      if (
        now >= previewOpen &&
        now < windowOpen &&
        (currentStatus === "locked" || currentStatus === "upcoming")
      ) {
        await admin
          .from("student_decan_progress")
          .upsert(
            {
              student_id: student.id,
              decan_id: decan.id,
              status: "preview",
              window_open: windowOpen.toISOString(),
              window_close: windowClose.toISOString(),
              grace_close: graceClose.toISOString(),
              updated_at: now.toISOString(),
            },
            { onConflict: "student_id,decan_id" }
          );
        previewed++;
        continue;
      }
    }
  }

  console.log(
    `[decan-unlock] previewed=${previewed} unlocked=${unlocked} graced=${graced} missed=${missed} retried=${retried}`
  );
  return NextResponse.json({ previewed, unlocked, graced, missed, retried });
}
