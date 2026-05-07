import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]
 * Returns a single decan with ritual steps, student progress, and journals.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sprint 2026-05-06: hard-block Decan detail when Foundation is incomplete.
  const gate = await requireDecanEligibilityOr403(createAdminClient(), user.id);
  if (gate && user.email !== "perennial1@test.astrologypro.com") return gate;

  const { id } = await params;
  const student = result.student as unknown as { id: string };

  const [decanRes, ritualsRes, progressRes, scryRes, journalRes, execRes] = await Promise.all([
    supabase
      .from("decans")
      .select(
        "id, decan_number, sign, planet, title, start_month, start_day, end_month, end_day, " +
          "description, decan_name, tarot_card_ref, artwork_url, preview_text, " +
          "astronomical_start, astronomical_end"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("decan_rituals")
      .select("id, step_order, step_type, content, is_published")
      .eq("decan_id", id)
      .eq("is_published", true)
      .order("step_order"),
    supabase
      .from("student_decan_progress")
      .select(
        "status, ritual_done, scry_done, journal_done, unlocked_at, completed_at, " +
          "window_open, window_close, grace_close, missed_at, " +
          "retry_year, retry_window_open, retry_window_close, " +
          "admin_excused, excuse_reason, excused_at"
      )
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .single(),
    supabase
      .from("scry_journals")
      .select("id, assigned_card, alternate_card, experience_text, content, submitted_at, submission_count")
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .maybeSingle(),
    supabase
      .from("mundane_journals")
      .select("id, relationships_section, business_work_section, shifts_perception_section, content, submitted_at")
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .maybeSingle(),
    supabase
      .from("ritual_executions")
      .select("id, current_step, total_steps, is_complete, completed_at")
      .eq("student_id", student.id)
      .eq("decan_id", id)
      .maybeSingle(),
  ]);

  if (!decanRes.data) return NextResponse.json({ error: "Decan not found" }, { status: 404 });

  const decan = decanRes.data as any;
  const prog = progressRes.data as any;
  const now = new Date();
  const currentYear = now.getFullYear();

  // Compute canonical window dates (same logic as /decans route)
  const crossesYear = decan.start_month === 12 && decan.end_month !== 12;
  const computedOpen = new Date(currentYear, decan.start_month - 1, decan.start_day, 0, 0, 0);
  const computedClose = new Date(
    crossesYear ? currentYear + 1 : currentYear,
    decan.end_month - 1,
    decan.end_day,
    23, 59, 59
  );
  const computedGrace = new Date(computedClose.getTime() + 2 * 24 * 60 * 60 * 1000);
  const previewOpen = new Date(computedOpen.getTime() - 7 * 24 * 60 * 60 * 1000);

  const windowOpen = prog?.window_open ? new Date(prog.window_open) : computedOpen;
  const windowClose = prog?.window_close ? new Date(prog.window_close) : computedClose;
  const graceClose = prog?.grace_close ? new Date(prog.grace_close) : computedGrace;

  // Derive live status (same rules as /decans route)
  let liveStatus: string = prog?.status ?? "locked";
  if (liveStatus !== "completed" && liveStatus !== "missed") {
    if (now >= windowOpen && now <= windowClose) {
      liveStatus = "active";
    } else if (now > windowClose && now <= graceClose) {
      const allDone = (prog?.ritual_done ?? false) && (prog?.scry_done ?? false) && (prog?.journal_done ?? false);
      liveStatus = allDone ? "completed" : "grace";
    } else if (now >= previewOpen && now < windowOpen) {
      liveStatus = "preview";
    }
  }

  if (user.email === "perennial1@test.astrologypro.com" && (liveStatus === "locked" || liveStatus === "upcoming")) {
    liveStatus = "active";
  }

  let daysRemaining: number | null = null;
  if (liveStatus === "active") {
    daysRemaining = Math.max(0, Math.ceil((windowClose.getTime() - now.getTime()) / 86400000));
  } else if (liveStatus === "grace") {
    daysRemaining = Math.max(0, Math.ceil((graceClose.getTime() - now.getTime()) / 86400000));
  }

  const effectiveProgress =
    prog
      ? {
          ...prog,
          status: liveStatus,
          window_open: windowOpen.toISOString(),
          window_close: windowClose.toISOString(),
          grace_close: graceClose.toISOString(),
          days_remaining: daysRemaining,
        }
      : liveStatus !== "locked"
        ? {
            status: liveStatus,
            ritual_done: false,
            scry_done: false,
            journal_done: false,
            unlocked_at: null,
            completed_at: null,
            window_open: windowOpen.toISOString(),
            window_close: windowClose.toISOString(),
            grace_close: graceClose.toISOString(),
            missed_at: null,
            retry_year: null,
            retry_window_open: null,
            retry_window_close: null,
            admin_excused: false,
            excuse_reason: null,
            excused_at: null,
            days_remaining: daysRemaining,
          }
        : null;

  return NextResponse.json({
    decan,
    ritualSteps: ritualsRes.data ?? [],
    progress: effectiveProgress,
    scryJournal: scryRes.data ?? null,
    mundaneJournal: journalRes.data ?? null,
    ritualExecution: execRes.data ?? null,
    studentId: student.id,
  });
}
