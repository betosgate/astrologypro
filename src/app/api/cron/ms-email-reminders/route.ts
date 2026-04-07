import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  sendDecanOpened,
  sendDecanUrgency3Days,
  sendGracePeriodStarted,
  sendGrace24HourWarning,
  sendDecanMissed,
  sendDecanReopened,
} from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * GET /api/cron/ms-email-reminders
 *
 * Runs every 6 hours. Sends idempotent lifecycle emails for Mystery School
 * students based on current decan progress state.
 *
 * Email types (used as keys in ms_email_log):
 *   decan_opened          — fires once when a decan becomes 'active'
 *   decan_urgency_3d      — fires once when window_close is within 3 days and decan is incomplete
 *   grace_started         — fires once when a decan transitions to 'grace'
 *   grace_24h_warning     — fires once when grace_close is within 24h and decan is incomplete
 *   decan_missed          — fires once when a decan is marked 'missed'
 *   decan_reopened        — fires once per missed decan when a retry window opens
 *
 * Deduplication is enforced via the ms_email_log UNIQUE(student_id, email_type, decan_id)
 * constraint. A failed send that does not write to ms_email_log will retry on the
 * next cron run — this is safe and intentional.
 *
 * NOTE: This cron is intentionally separate from /api/cron/decan-unlock.
 * That cron manages lifecycle state transitions; this one sends emails.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const past6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  const stats = {
    decan_opened: 0,
    decan_urgency_3d: 0,
    grace_started: 0,
    grace_24h_warning: 0,
    decan_missed: 0,
    decan_reopened: 0,
    errors: 0,
  };

  // ── Fetch all active MS students with their auth email ─────────────────────
  type StudentRow = {
    id: string;
    user_id: string;
    training_status: string;
  };

  const { data: studentsRaw } = await admin
    .from("mystery_school_students")
    .select("id, user_id, training_status")
    .in("training_status", ["foundation", "decans", "active"])
    .eq("status", "active");

  if (!studentsRaw || studentsRaw.length === 0) {
    return NextResponse.json({ ...stats, message: "No active students" });
  }

  const students = studentsRaw as unknown as StudentRow[];

  // Fetch all decans (need tarot_card_ref for decan_opened email)
  type DecanRow = {
    id: string;
    decan_number: number;
    sign: string;
    planet: string;
    title: string;
    tarot_card_ref: string | null;
  };

  const { data: decansRaw } = await admin
    .from("decans")
    .select("id, decan_number, sign, planet, title, tarot_card_ref")
    .order("decan_number");

  const decanMap = new Map<string, DecanRow>(
    ((decansRaw ?? []) as unknown as DecanRow[]).map((d) => [d.id, d])
  );

  // Helper: check idempotency and log a sent email
  async function hasBeenSent(
    studentId: string,
    emailType: string,
    decanId: string | null
  ): Promise<boolean> {
    const { data } = await admin
      .from("ms_email_log")
      .select("id")
      .eq("student_id", studentId)
      .eq("email_type", emailType)
      .eq("decan_id", decanId ?? null as unknown as string)
      .maybeSingle();
    return !!data;
  }

  async function markSent(
    studentId: string,
    emailType: string,
    decanId: string | null
  ) {
    await admin.from("ms_email_log").insert({
      student_id: studentId,
      email_type: emailType,
      decan_id: decanId ?? null,
    });
  }

  // ── Process each student ───────────────────────────────────────────────────
  for (const student of students) {
    // Get auth user email + name
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(student.user_id);
    const email = authUser?.email;
    if (!email) continue;

    const name =
      (authUser?.user_metadata?.full_name as string | undefined) ??
      (authUser?.user_metadata?.name as string | undefined) ??
      "Student";

    // Fetch all progress rows for this student
    type ProgressRow = {
      decan_id: string;
      status: string;
      ritual_done: boolean;
      scry_done: boolean;
      journal_done: boolean;
      window_open: string | null;
      window_close: string | null;
      grace_close: string | null;
      unlocked_at: string | null;
      missed_at: string | null;
      updated_at: string | null;
    };

    const { data: progressRaw } = await admin
      .from("student_decan_progress")
      .select(
        "decan_id, status, ritual_done, scry_done, journal_done, " +
          "window_open, window_close, grace_close, unlocked_at, missed_at, updated_at"
      )
      .eq("student_id", student.id);

    const progressRows = (progressRaw ?? []) as unknown as ProgressRow[];

    for (const progress of progressRows) {
      const decan = decanMap.get(progress.decan_id);
      if (!decan) continue;

      const decanUrl = `${appUrl}/mystery-school/decans/${progress.decan_id}`;

      const allDone =
        progress.ritual_done && progress.scry_done && progress.journal_done;

      const incompleteItems: string[] = [];
      if (!progress.ritual_done) incompleteItems.push("Ritual");
      if (!progress.scry_done) incompleteItems.push("Scrying journal");
      if (!progress.journal_done) incompleteItems.push("Mundane impact journal");

      try {
        // ── 1. DECAN OPENED — status became 'active' in the last 6h ─────────
        if (
          progress.status === "active" &&
          progress.unlocked_at &&
          new Date(progress.unlocked_at) >= past6h &&
          !allDone
        ) {
          const sent = await hasBeenSent(student.id, "decan_opened", progress.decan_id);
          if (!sent && progress.window_close) {
            await sendDecanOpened({
              to: email,
              name,
              decanTitle: decan.title,
              decanNumber: decan.decan_number,
              sign: decan.sign,
              planet: decan.planet,
              tarotCard: decan.tarot_card_ref,
              windowClose: progress.window_close,
              actionUrl: decanUrl,
            });
            await markSent(student.id, "decan_opened", progress.decan_id);
            stats.decan_opened++;
          }
        }

        // ── 2. URGENCY 3 DAYS — window_close within 3 days, not complete ────
        if (
          progress.status === "active" &&
          progress.window_close &&
          new Date(progress.window_close) <= in3Days &&
          new Date(progress.window_close) > now &&
          !allDone
        ) {
          const sent = await hasBeenSent(student.id, "decan_urgency_3d", progress.decan_id);
          if (!sent) {
            await sendDecanUrgency3Days({
              to: email,
              name,
              decanTitle: decan.title,
              decanNumber: decan.decan_number,
              windowClose: progress.window_close,
              incompleteItems,
              actionUrl: decanUrl,
            });
            await markSent(student.id, "decan_urgency_3d", progress.decan_id);
            stats.decan_urgency_3d++;
          }
        }

        // ── 3. GRACE STARTED — status is 'grace' and updated_at within 6h ──
        if (
          progress.status === "grace" &&
          progress.updated_at &&
          new Date(progress.updated_at) >= past6h &&
          !allDone
        ) {
          const sent = await hasBeenSent(student.id, "grace_started", progress.decan_id);
          if (!sent && progress.grace_close) {
            await sendGracePeriodStarted({
              to: email,
              name,
              decanTitle: decan.title,
              decanNumber: decan.decan_number,
              graceClose: progress.grace_close,
              incompleteItems,
              actionUrl: decanUrl,
            });
            await markSent(student.id, "grace_started", progress.decan_id);
            stats.grace_started++;
          }
        }

        // ── 4. GRACE 24H WARNING — grace_close within 24h, not complete ─────
        if (
          progress.status === "grace" &&
          progress.grace_close &&
          new Date(progress.grace_close) <= in24h &&
          new Date(progress.grace_close) > now &&
          !allDone
        ) {
          const sent = await hasBeenSent(student.id, "grace_24h_warning", progress.decan_id);
          if (!sent) {
            await sendGrace24HourWarning({
              to: email,
              name,
              decanTitle: decan.title,
              decanNumber: decan.decan_number,
              graceClose: progress.grace_close,
              incompleteItems,
              actionUrl: decanUrl,
            });
            await markSent(student.id, "grace_24h_warning", progress.decan_id);
            stats.grace_24h_warning++;
          }
        }

        // ── 5. DECAN MISSED — status became 'missed' in the last 6h ─────────
        if (
          progress.status === "missed" &&
          progress.missed_at &&
          new Date(progress.missed_at) >= past6h
        ) {
          const sent = await hasBeenSent(student.id, "decan_missed", progress.decan_id);
          if (!sent) {
            // Retry window = same decan same dates next year
            const nextYear = new Date().getFullYear() + 1;
            await sendDecanMissed({
              to: email,
              name,
              decanTitle: decan.title,
              decanNumber: decan.decan_number,
              retryWindowOpen: null,
              retryYear: nextYear,
            });
            await markSent(student.id, "decan_missed", progress.decan_id);
            stats.decan_missed++;
          }
        }

        // ── 6. DECAN REOPENED — missed decan's retry window_open is within
        //    the last 6h (i.e. the decan-unlock cron re-activated a missed row
        //    that has retry_count > 0). Detect by: status = 'active' AND
        //    unlocked_at within 6h AND a 'decan_missed' log entry exists
        //    (meaning this is a re-open, not a first open).
        if (
          progress.status === "active" &&
          progress.unlocked_at &&
          new Date(progress.unlocked_at) >= past6h
        ) {
          const wasMissed = await hasBeenSent(student.id, "decan_missed", progress.decan_id);
          if (wasMissed) {
            const sent = await hasBeenSent(student.id, "decan_reopened", progress.decan_id);
            if (!sent && progress.window_open && progress.window_close) {
              await sendDecanReopened({
                to: email,
                name,
                decanTitle: decan.title,
                decanNumber: decan.decan_number,
                retryWindowOpen: progress.window_open,
                retryWindowClose: progress.window_close,
                actionUrl: decanUrl,
              });
              await markSent(student.id, "decan_reopened", progress.decan_id);
              stats.decan_reopened++;
            }
          }
        }
      } catch (err) {
        console.error(
          `[ms-email-reminders] Error for student=${student.id} decan=${decan.decan_number}:`,
          err
        );
        stats.errors++;
      }
    }
  }

  console.log("[ms-email-reminders]", JSON.stringify(stats));
  return NextResponse.json(stats);
}
