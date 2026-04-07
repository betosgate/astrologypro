import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendPostGraduationConsultationReminder } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/ms-post-grad-reminders
 * Runs daily at 09:00 UTC.
 *
 * Sends post-graduation consultation reminder emails to graduated Mystery School
 * students who have NOT yet booked their post-graduation consultation.
 *
 * Reminder schedule (relative to graduated_at):
 *   Day 0   — immediate (fires on the graduation day run)
 *   Day 3   — 3 days after graduation
 *   Day 7   — 7 days after graduation
 *   Weekly  — every 7 days thereafter (day 14, 21, 28, ...)
 *
 * Stop condition: post_grad_consultation_booked_at IS NOT NULL
 *
 * Deduplication: ms_email_log UNIQUE(student_id, email_type) WHERE decan_id IS NULL
 * Email type key pattern: "post_grad_reminder_d0", "post_grad_reminder_d3", etc.
 * For weekly cadence after day 7: "post_grad_reminder_w{n}" where n = week number (2, 3, …)
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

// Day offsets that have a named reminder step
const FIXED_DAY_OFFSETS = [0, 3, 7] as const;
// Weekly cadence starts at day 14 (week 2 post-grad)
const WEEKLY_START_DAY = 14;

function emailTypeForDay(dayOffset: number): string {
  if (dayOffset <= 7) return `post_grad_reminder_d${dayOffset}`;
  // Week number: 14 = week2, 21 = week3, etc.
  const weekNum = Math.floor(dayOffset / 7);
  return `post_grad_reminder_w${weekNum}`;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const now = new Date();

  // Fetch all graduated students who have not yet booked their consultation
  type StudentRow = {
    id: string;
    user_id: string;
    graduated_at: string;
    post_grad_consultation_booked_at: string | null;
  };

  const { data: studentsRaw, error: studentsError } = await admin
    .from("mystery_school_students")
    .select("id, user_id, graduated_at, post_grad_consultation_booked_at")
    .eq("training_status", "graduated")
    .not("graduated_at", "is", null)
    .is("post_grad_consultation_booked_at", null);

  if (studentsError) {
    console.error("[ms-post-grad-reminders] Failed to fetch students:", studentsError.message);
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  if (!studentsRaw || studentsRaw.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: 0 });
  }

  const students = studentsRaw as unknown as StudentRow[];

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const student of students) {
    const graduatedAt = new Date(student.graduated_at);
    const daysSinceGrad = Math.floor(
      (now.getTime() - graduatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine which reminder step is due today
    let dueDayOffset: number | null = null;

    for (const offset of FIXED_DAY_OFFSETS) {
      if (daysSinceGrad >= offset && daysSinceGrad < offset + (offset === 7 ? 7 : 3)) {
        // Within the send window for this step:
        // d0: send if daysSinceGrad 0-2
        // d3: send if daysSinceGrad 3-6
        // d7: send if daysSinceGrad 7-13
        if (
          (offset === 0 && daysSinceGrad < 3) ||
          (offset === 3 && daysSinceGrad >= 3 && daysSinceGrad < 7) ||
          (offset === 7 && daysSinceGrad >= 7 && daysSinceGrad < 14)
        ) {
          dueDayOffset = offset;
          break;
        }
      }
    }

    // Weekly reminder: day 14, 21, 28, ...
    if (dueDayOffset === null && daysSinceGrad >= WEEKLY_START_DAY) {
      const weekNum = Math.floor(daysSinceGrad / 7);
      const weekStartDay = weekNum * 7;
      // Send once per week bucket (within 1 day of the start of the week bucket)
      if (daysSinceGrad - weekStartDay < 2) {
        dueDayOffset = weekStartDay;
      }
    }

    if (dueDayOffset === null) {
      skipped++;
      continue;
    }

    const emailType = emailTypeForDay(dueDayOffset);

    // Idempotency check — was this step already sent?
    const { data: alreadySent } = await admin
      .from("ms_email_log")
      .select("id")
      .eq("student_id", student.id)
      .eq("email_type", emailType)
      .is("decan_id", null)
      .maybeSingle();

    if (alreadySent) {
      skipped++;
      continue;
    }

    // Fetch auth user email + name
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(student.user_id);
    const email = authUser?.email;
    if (!email) {
      skipped++;
      continue;
    }

    const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      "Graduate";

    const graduationDate = graduatedAt.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const bookingUrl = `${APP_URL}/mystery-school/training/post-graduation`;

    try {
      await sendPostGraduationConsultationReminder({
        to: email,
        name,
        graduationDate,
        dayOffset: dueDayOffset,
        bookingUrl,
      });

      // Log the send — UNIQUE constraint prevents duplicates if cron runs twice
      await admin.from("ms_email_log").insert({
        student_id: student.id,
        email_type: emailType,
        decan_id: null,
      }).select().single();

      sent++;
    } catch (err) {
      console.error(
        `[ms-post-grad-reminders] Error for student=${student.id} type=${emailType}:`,
        err
      );
      errors++;
    }
  }

  console.log(`[ms-post-grad-reminders] sent=${sent} skipped=${skipped} errors=${errors}`);
  return NextResponse.json({ sent, skipped, errors });
}
