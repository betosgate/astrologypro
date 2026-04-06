import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decans
 * Returns all 36 decans with enriched metadata and per-student lifecycle status.
 *
 * Status lifecycle:
 *   locked    → no progress record, outside all windows
 *   upcoming  → progress row exists but window is > 7 days away
 *   preview   → within 7-day preview window before action window opens
 *   active    → within window_open..window_close
 *   grace     → within window_close..grace_close (not yet completed)
 *   completed → ritual_done && scry_done && journal_done
 *   missed    → grace_close passed, not completed
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  const memberTyped = member as unknown as {
    membership_type: string;
    membership_status: string;
  } | null;

  if (
    !memberTyped ||
    memberTyped.membership_type !== "mystery_school" ||
    memberTyped.membership_status !== "active"
  ) {
    return NextResponse.json(
      { error: "Mystery School membership required" },
      { status: 403 }
    );
  }

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id, training_status, start_quarter, enrolled_at")
    .eq("user_id", user.id)
    .single();

  const studentTyped = student as unknown as {
    id: string;
    training_status: string;
    start_quarter: string;
    enrolled_at: string;
  } | null;

  if (!studentTyped)
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });

  // Q1 complete check — student has completed all 12 foundation weeks
  const { count: q1Count } = await supabase
    .from("student_foundation_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentTyped.id);

  const q1Complete = (q1Count ?? 0) >= 12;

  // All 36 decans with new metadata columns
  const { data: decansRaw, error: decansError } = await supabase
    .from("decans")
    .select(
      "id, decan_number, sign, planet, title, " +
        "decan_name, tarot_card_ref, artwork_url, preview_text, " +
        "astronomical_start, astronomical_end, " +
        "start_month, start_day, end_month, end_day, description"
    )
    .order("decan_number");

  if (decansError)
    return NextResponse.json({ error: decansError.message }, { status: 500 });

  type DecanRow = {
    id: string;
    decan_number: number;
    sign: string;
    planet: string;
    title: string;
    decan_name: string | null;
    tarot_card_ref: string | null;
    artwork_url: string | null;
    preview_text: string | null;
    astronomical_start: string | null;
    astronomical_end: string | null;
    start_month: number;
    start_day: number;
    end_month: number;
    end_day: number;
    description: string | null;
  };

  const decans = (decansRaw ?? []) as unknown as DecanRow[];

  // Student's progress records — include new lifecycle columns
  const { data: progressRaw } = await supabase
    .from("student_decan_progress")
    .select(
      "decan_id, status, ritual_done, scry_done, journal_done, " +
        "unlocked_at, completed_at, missed_at, " +
        "window_open, window_close, grace_close"
    )
    .eq("student_id", studentTyped.id);

  type ProgressRow = {
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
  };

  const progressMap = new Map<string, ProgressRow>(
    ((progressRaw ?? []) as unknown as ProgressRow[]).map((p) => [p.decan_id, p])
  );

  const now = new Date();
  const currentYear = now.getFullYear();

  /**
   * Compute the canonical window_open / window_close / grace_close for a decan.
   * If the progress row already has persisted lifecycle fields (set by the cron),
   * those take precedence.
   */
  function decanWindows(d: Pick<DecanRow, "start_month" | "start_day" | "end_month" | "end_day">) {
    const crossesYearBoundary = d.start_month === 12 && d.end_month !== 12;
    const windowOpen = new Date(currentYear, d.start_month - 1, d.start_day, 0, 0, 0);
    const windowClose = new Date(
      crossesYearBoundary ? currentYear + 1 : currentYear,
      d.end_month - 1,
      d.end_day,
      23, 59, 59
    );
    const graceClose = new Date(windowClose.getTime() + 2 * 24 * 60 * 60 * 1000);
    const previewOpen = new Date(windowOpen.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { windowOpen, windowClose, graceClose, previewOpen };
  }

  let currentDecanNumber: number | null = null;

  const decansWithStatus = decans.map((decan) => {
    const p = progressMap.get(decan.id);
    const computed = decanWindows(decan);

    // Prefer persisted lifecycle fields from progress row (set by cron on activation)
    const windowOpen: Date = p?.window_open ? new Date(p.window_open) : computed.windowOpen;
    const windowClose: Date = p?.window_close ? new Date(p.window_close) : computed.windowClose;
    const graceClose: Date = p?.grace_close ? new Date(p.grace_close) : computed.graceClose;
    const previewOpen: Date = computed.previewOpen;

    // DB value is authoritative for completed/missed/grace;
    // compute active/upcoming/preview from live dates for rows the cron hasn't touched yet.
    let status: string = p?.status ?? "locked";

    if (status !== "completed" && status !== "missed") {
      if (now >= windowOpen && now <= windowClose) {
        status = "active";
      } else if (now > windowClose && now <= graceClose) {
        const allDone =
          (p?.ritual_done ?? false) &&
          (p?.scry_done ?? false) &&
          (p?.journal_done ?? false);
        status = allDone ? "completed" : "grace";
      } else if (now >= previewOpen && now < windowOpen) {
        status = "preview";
      } else if (now < previewOpen) {
        // More than 7 days away — upcoming if progress row exists, locked otherwise
        status = p ? "upcoming" : "locked";
      }
    }

    if (status === "active") {
      currentDecanNumber = decan.decan_number;
    }

    // Days remaining (null if not active/grace)
    let daysRemaining: number | null = null;
    if (status === "active") {
      daysRemaining = Math.max(
        0,
        Math.ceil((windowClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    } else if (status === "grace") {
      daysRemaining = Math.max(
        0,
        Math.ceil((graceClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      id: decan.id,
      decan_number: decan.decan_number,
      sign: decan.sign,
      planet: decan.planet,
      title: decan.title,
      decan_name: decan.decan_name ?? null,
      tarot_card_ref: decan.tarot_card_ref ?? null,
      artwork_url: decan.artwork_url ?? null,
      preview_text: decan.preview_text ?? null,
      start_month: decan.start_month,
      start_day: decan.start_day,
      end_month: decan.end_month,
      end_day: decan.end_day,
      astronomical_start: decan.astronomical_start ?? null,
      astronomical_end: decan.astronomical_end ?? null,
      // Student progress
      status,
      window_open: windowOpen.toISOString(),
      window_close: windowClose.toISOString(),
      grace_close: graceClose.toISOString(),
      unlocked_at: p?.unlocked_at ?? null,
      completed_at: p?.completed_at ?? null,
      ritual_done: p?.ritual_done ?? false,
      scry_done: p?.scry_done ?? false,
      journal_done: p?.journal_done ?? false,
      days_remaining: daysRemaining,
      is_current: status === "active",
    };
  });

  const completedCount = decansWithStatus.filter((d) => d.status === "completed").length;

  return NextResponse.json({
    student: {
      id: studentTyped.id,
      trainingStatus: studentTyped.training_status,
      startQuarter: studentTyped.start_quarter,
    },
    decans: decansWithStatus,
    completedCount,
    totalDecans: 36,
    current_decan_number: currentDecanNumber,
    q1_complete: q1Complete,
  });
}
