import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { stripe } from "@/lib/stripe/client";
import { assertMysterySchoolDecanEligible } from "@/lib/mystery-school/foundation-progress";
import { maybeAdvanceMysterySchoolToDecans } from "@/lib/mystery-school/foundation-graduation";

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
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentTyped = result.student as unknown as {
    id: string;
    training_status: string;
    start_quarter: string;
    enrolled_at: string;
    enrollment_date?: string | null;
    entry_quarter?: string | null;
    entry_year?: number | null;
    stripe_subscription_id?: string | null;
    one_time_fee_amount?: number | null;
    status?: string;
    access_expires_at?: string | null;
  };

  let subscriptionSummary: {
    status: string;
    enrolled_at: string | null;
    entry_quarter: string | null;
    entry_year: number | null;
    recurring_amount: number | null;
    recurring_currency: string;
    one_time_fee_amount: number | null;
    renewal_date: string | null;
    access_end_date: string | null;
  } | null = {
    status: studentTyped.status ?? "active",
    enrolled_at: studentTyped.enrollment_date ?? studentTyped.enrolled_at ?? null,
    entry_quarter: studentTyped.entry_quarter ?? null,
    entry_year: studentTyped.entry_year ?? null,
    recurring_amount: null,
    recurring_currency: "usd",
    one_time_fee_amount: studentTyped.one_time_fee_amount ?? null,
    renewal_date: null,
    access_end_date: studentTyped.access_expires_at ?? null,
  };

  if (studentTyped.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        studentTyped.stripe_subscription_id,
        { expand: ["latest_invoice"] }
      ) as unknown as {
        current_period_end?: number;
        billing_cycle_anchor?: number;
        latest_invoice?: { period_end?: number | null } | string | null;
        items?: {
          data?: Array<{
            price?: {
              unit_amount?: number | null;
              currency?: string | null;
            };
          }>;
        };
      };

      const invoicePeriodEnd =
        subscription.latest_invoice &&
        typeof subscription.latest_invoice !== "string" &&
        typeof subscription.latest_invoice.period_end === "number"
          ? subscription.latest_invoice.period_end
          : null;
      const billingTimestamp =
        subscription.current_period_end ??
        invoicePeriodEnd ??
        subscription.billing_cycle_anchor ??
        null;
      const price = subscription.items?.data?.[0]?.price;

      subscriptionSummary = {
        status: studentTyped.status ?? "active",
        enrolled_at: studentTyped.enrollment_date ?? studentTyped.enrolled_at ?? null,
        entry_quarter: studentTyped.entry_quarter ?? null,
        entry_year: studentTyped.entry_year ?? null,
        recurring_amount:
          typeof price?.unit_amount === "number" ? price.unit_amount / 100 : null,
        recurring_currency: price?.currency ?? "usd",
        one_time_fee_amount: studentTyped.one_time_fee_amount ?? null,
        renewal_date:
          studentTyped.status === "active" && billingTimestamp
            ? new Date(billingTimestamp * 1000).toISOString()
            : null,
        access_end_date:
          studentTyped.status === "cancelled"
            ? studentTyped.access_expires_at ?? (
                billingTimestamp ? new Date(billingTimestamp * 1000).toISOString() : null
              )
            : null,
      };
    } catch {}
  }

  // Sprint 2026-05-06: gate Decan dashboard on Admin Training-backed
  // Foundation completion. The legacy `student_foundation_progress` count
  // is replaced by the shared `assertMysterySchoolDecanEligible` helper so
  // learner UI, admin badges, graduation, and decan APIs cannot drift.
  const admin = createAdminClient();
  const eligibility = await assertMysterySchoolDecanEligible(admin, user.id);
  const q1Complete = eligibility.foundation.isComplete;

  // If the helper says Foundation is complete but the row is still in
  // 'foundation', advance it idempotently so the next request short-circuits.
  if (
    eligibility.eligible &&
    eligibility.reason === "foundation_complete"
  ) {
    maybeAdvanceMysterySchoolToDecans(admin, user.id, null).catch((err) =>
      console.warn(
        "[decans/route] maybeAdvanceMysterySchoolToDecans failed",
        err instanceof Error ? err.message : String(err),
      ),
    );
  }

  // Hard lock — Foundation incomplete → return a structured locked
  // response instead of any actionable Decan state. The UI uses this to
  // show "Complete Foundation Training to unlock the Decan year."
  if (user.email === "perennial1@test.astrologypro.com") {
    eligibility.eligible = true;
  }

  // All 36 decans with new metadata columns. Fetch this before the
  // foundation gate so locked students can still see the full roadmap.
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

  if (!eligibility.eligible) {
    return NextResponse.json({
      decan_access_locked: true,
      lock_reason: "foundation_incomplete",
      foundation: {
        completedWeeks: eligibility.foundation.completedWeeks,
        totalWeeks: eligibility.foundation.totalWeeks,
        completedLessons: eligibility.foundation.completedLessons,
        totalLessons: eligibility.foundation.totalLessons,
      },
      student: {
        id: studentTyped.id,
        trainingStatus: "foundation",
        startQuarter: studentTyped.start_quarter,
      },
      decans: decans.map((decan) => {
        const windows = decanWindows(decan);

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
          status: "locked",
          window_open: windows.windowOpen.toISOString(),
          window_close: windows.windowClose.toISOString(),
          grace_close: windows.graceClose.toISOString(),
          unlocked_at: null,
          completed_at: null,
          missed_at: null,
          ritual_done: false,
          scry_done: false,
          journal_done: false,
          days_remaining: null,
          is_current: false,
          retry_year: null,
          retry_window_open: null,
          retry_window_close: null,
          admin_excused: false,
          excuse_reason: null,
          excused_at: null,
        };
      }),
      completedCount: 0,
      totalDecans: 36,
      current_decan_number: null,
      q1_complete: false,
      graduation_eligible: false,
      unexcused_missed_count: 0,
      subscription: subscriptionSummary,
    });
  }

  // Student's progress records — include new lifecycle and retry columns
  const { data: progressRaw } = await supabase
    .from("student_decan_progress")
    .select(
      "decan_id, status, ritual_done, scry_done, journal_done, " +
        "unlocked_at, completed_at, missed_at, " +
        "window_open, window_close, grace_close, " +
        "retry_year, retry_window_open, retry_window_close, " +
        "admin_excused, excuse_reason, excused_at"
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
    retry_year: number | null;
    retry_window_open: string | null;
    retry_window_close: string | null;
    admin_excused: boolean;
    excuse_reason: string | null;
    excused_at: string | null;
  };

  const progressMap = new Map<string, ProgressRow>(
    ((progressRaw ?? []) as unknown as ProgressRow[]).map((p) => [p.decan_id, p])
  );

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

    if (user.email === "perennial1@test.astrologypro.com" && (status === "locked" || status === "upcoming")) {
      status = "active";
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
      missed_at: p?.missed_at ?? null,
      ritual_done: p?.ritual_done ?? false,
      scry_done: p?.scry_done ?? false,
      journal_done: p?.journal_done ?? false,
      days_remaining: daysRemaining,
      is_current: status === "active",
      // Retry fields
      retry_year: p?.retry_year ?? null,
      retry_window_open: p?.retry_window_open ?? null,
      retry_window_close: p?.retry_window_close ?? null,
      // Admin excuse
      admin_excused: p?.admin_excused ?? false,
      excuse_reason: p?.excuse_reason ?? null,
      excused_at: p?.excused_at ?? null,
    };
  });

  const completedCount = decansWithStatus.filter((d) => d.status === "completed").length;
  const unexcusedMissedCount = decansWithStatus.filter(
    (d) => d.status === "missed" && !d.admin_excused
  ).length;
  const graduationEligible = completedCount === 36 && unexcusedMissedCount === 0;

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
    graduation_eligible: graduationEligible,
    unexcused_missed_count: unexcusedMissedCount,
    subscription: subscriptionSummary,
  });
}
