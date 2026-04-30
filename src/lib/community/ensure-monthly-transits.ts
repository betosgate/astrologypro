/**
 * Ensure current-month transit summaries for a community member.
 *
 * Spec source:
 *   tasks/27.04.2026/community-monthly-transit-architecture/04-add-mid-month-catch-up-generation.md
 *   tasks/27.04.2026/community-monthly-transit-architecture/05-integrate-generation-triggers.md
 *
 * One reusable service called from multiple lifecycle points so the
 * "current-month summary" guarantee doesn't depend on the 1st-of-month
 * cron alone:
 *
 *   - cron               (1st of every month, every active member)
 *   - subscription flip  (when membership becomes active mid-month, via
 *                         the lazy-fallback page visit below)
 *   - natal completion   (when a self/added family chart is freshly generated)
 *   - lazy fallback      (visit to /community/transits with eligible-but-
 *                         missing rows kicks this off server-side)
 *
 * The service is *not* the place to enforce auth/entitlement at the HTTP
 * layer — callers must already hold a verified `memberId`. The service
 * does re-check `community_members.membership_status = 'active'` as a
 * defense-in-depth measure, so a stale memberId from a cancelled session
 * cannot accidentally provision rows.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateMonthlyTransits,
  type MonthlyTransitData,
} from "@/lib/astro/transits";
import type { NatalChartData } from "@/lib/astro/natal-chart";
import { isValidMonthlyTransit, isValidNatalChart } from "@/lib/community/chart-validators";
import {
  computeBirthDataReadiness,
  buildNatalChartFromBirthData,
  type BirthDataInput,
} from "@/lib/community/birth-data-readiness";

export type EnsureSkipReason =
  | "current_valid"
  | "incomplete_birth_data";

export interface EnsureMonthlyTransitsResult {
  /** Month key the run targeted (`YYYY-MM`). */
  month: string;
  /** Whether the member was active at the time of the run. */
  active: boolean;
  /** Total eligible family-member candidates evaluated. */
  evaluated: number;
  /** Brand-new rows created for this run. */
  generated: number;
  /** Existing valid current-month rows that were left alone. */
  skipped: number;
  /** Failed rows that were retried (existed with status=failed before). */
  retried: number;
  /** Stale-shape rows that were regenerated. */
  regenerated: number;
  /** Members blocked because their birth data is incomplete. */
  blocked: number;
  /** Rows that failed to generate this run. */
  failed: number;
  /** Per-row diagnostics (kept compact for log lines and admin tooling). */
  details: Array<{
    family_member_id: string;
    full_name: string | null;
    outcome:
      | "generated"
      | "skipped"
      | "retried"
      | "regenerated"
      | "blocked"
      | "failed";
    reason?: string;
  }>;
}

export interface EnsureOptions {
  /**
   * Override the current month (`YYYY-MM`). Default: server's "now".
   * Useful for cron-style runs that want to backfill a specific month.
   */
  month?: string;
  /**
   * If true, regenerate even existing valid rows. Use sparingly.
   */
  forceRegenerate?: boolean;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(monthStr: string): { year: number; month: number } | null {
  const m = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!(year >= 1900 && year <= 2200 && month >= 1 && month <= 12)) return null;
  return { year, month };
}

/**
 * Ensure current-month `monthly_transits` rows exist for every eligible
 * family member of `memberId`. See module-level doc for trigger design.
 *
 * Returns a structured result so callers can render a "preparing" / "X
 * generated" / "Y failed" UX without re-querying state.
 *
 * Idempotent. Safe to call repeatedly — already-current rows are skipped
 * unless `forceRegenerate=true`.
 */
export async function ensureCurrentMonthTransitsForMember(
  memberId: string,
  options: EnsureOptions = {}
): Promise<EnsureMonthlyTransitsResult> {
  const month = options.month ?? currentMonthKey();
  const parsed = parseMonthKey(month);
  if (!parsed) {
    throw new Error(`Invalid month key: ${month}`);
  }
  const { year, month: monthNum } = parsed;
  const force = options.forceRegenerate === true;

  const admin = createAdminClient();

  const result: EnsureMonthlyTransitsResult = {
    month,
    active: false,
    evaluated: 0,
    generated: 0,
    skipped: 0,
    retried: 0,
    regenerated: 0,
    blocked: 0,
    failed: 0,
    details: [],
  };

  // ── Defense-in-depth: re-verify active membership ──────────────────────
  const { data: member } = await admin
    .from("community_members")
    .select("id, membership_status")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return result; // active stays false; counts stay zero
  }
  if (member.membership_status !== "active") {
    return result;
  }
  result.active = true;

  // ── Find eligible family members ───────────────────────────────────────
  // Eligibility = complete birth data. The natal_chart product is no
  // longer the gate — the admin Horoscope Toolkit model treats birth
  // data as the prerequisite and computes whatever report is requested
  // directly. We follow the same rule here: any row with complete birth
  // fields is eligible, regardless of natal_chart cache state.
  //
  // Saved natal_chart JSON is still honoured as a read-through cache
  // when shape-valid (see compute loop below) — but its absence does
  // NOT block monthly summary generation.
  const { data: familyRows } = await admin
    .from("community_family_members")
    .select(
      "id, full_name, natal_chart, natal_status, age_group, date_of_birth, birth_time, birth_city, birth_country, birth_lat, birth_lng"
    )
    .eq("member_id", memberId);

  type FamilyRow = BirthDataInput & {
    id: string;
    full_name: string;
    natal_chart: unknown;
    natal_status: string | null;
  };

  const family = (familyRows ?? []) as FamilyRow[];

  const eligible: FamilyRow[] = [];
  for (const fm of family) {
    const readiness = computeBirthDataReadiness(fm);
    if (!readiness.complete) {
      result.blocked++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "blocked",
        reason: `incomplete_birth_data: ${readiness.missing.join(",")}`,
      });
      continue;
    }
    eligible.push(fm);
  }

  result.evaluated = eligible.length;

  if (eligible.length === 0) {
    return result;
  }

  // ── Pre-fetch existing rows for the target month ──────────────────────
  const eligibleIds = eligible.map((e) => e.id);
  const { data: existingRows } = await admin
    .from("monthly_transits")
    .select("id, family_member_id, transit_data, generation_status")
    .in("family_member_id", eligibleIds)
    .eq("month", month);

  const existingByMember = new Map<
    string,
    {
      id: string;
      transit_data: unknown;
      generation_status: string | null;
    }
  >();
  for (const row of existingRows ?? []) {
    existingByMember.set(row.family_member_id, {
      id: row.id,
      transit_data: row.transit_data,
      generation_status: row.generation_status as string | null,
    });
  }

  // ── Per-member ensure loop ────────────────────────────────────────────
  for (const fm of eligible) {
    const existing = existingByMember.get(fm.id);
    const existingValid =
      existing != null &&
      existing.generation_status === "generated" &&
      isValidMonthlyTransit(existing.transit_data, month);

    // Cache hit → skip unless forced.
    if (existingValid && !force) {
      result.skipped++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "skipped",
        reason: "current_valid",
      });
      continue;
    }

    const attemptedAt = new Date().toISOString();
    const wasFailed = existing?.generation_status === "failed";
    const wasStale = existing != null && !existingValid && !wasFailed;

    // Reserve / claim the row as `pending` before computing so concurrent
    // runs (cron + lazy fallback) don't double-write.
    let transitId: string | null = existing?.id ?? null;

    if (transitId) {
      // Existing row — flip to pending while we recompute.
      await admin
        .from("monthly_transits")
        .update({
          generation_status: "pending",
          last_attempted_at: attemptedAt,
        })
        .eq("id", transitId);
    } else {
      // Insert a pending placeholder. Unique on (family_member_id, month)
      // prevents duplicate concurrent inserts.
      const { data: pendingRow, error: insertErr } = await admin
        .from("monthly_transits")
        .insert({
          family_member_id: fm.id,
          month,
          transit_data: {},
          generation_status: "pending",
          notification_sent: false,
          last_attempted_at: attemptedAt,
        })
        .select("id")
        .single();

      if (insertErr || !pendingRow) {
        // The most likely cause is a concurrent insert from another runner
        // (e.g. cron + lazy fallback) — re-read the row and treat as skipped.
        const { data: raceRow } = await admin
          .from("monthly_transits")
          .select("id")
          .eq("family_member_id", fm.id)
          .eq("month", month)
          .maybeSingle();
        if (raceRow) {
          result.skipped++;
          result.details.push({
            family_member_id: fm.id,
            full_name: fm.full_name,
            outcome: "skipped",
            reason: "concurrent_run",
          });
          continue;
        }
        result.failed++;
        result.details.push({
          family_member_id: fm.id,
          full_name: fm.full_name,
          outcome: "failed",
          reason: insertErr?.message ?? "insert_failed",
        });
        continue;
      }
      transitId = pendingRow.id;
    }

    // Compute.
    //
    // Independent product rule: monthly transit summary computes from
    // birth data on the fly. The stored `natal_chart` is honoured as a
    // read-through cache when shape-valid (saves the Sun/Moon/etc.
    // Astronomy Engine work), but missing or stale cache is NOT a
    // blocker — we just rebuild the natal positions in memory from
    // birth fields. Side-effect: zero. We never write back to
    // `community_family_members.natal_chart` from this path.
    let transitData: MonthlyTransitData;
    try {
      const natalForCompute: NatalChartData = isValidNatalChart(fm.natal_chart)
        ? (fm.natal_chart as NatalChartData)
        : buildNatalChartFromBirthData(fm);
      transitData = calculateMonthlyTransits(natalForCompute, year, monthNum);
    } catch (calcErr) {
      const reason =
        calcErr instanceof Error ? calcErr.message : "calculation_error";
      // Preserves the cron's prior retry_count semantics: increment by 1
      // when the existing row was already failed, otherwise start at 1.
      await admin
        .from("monthly_transits")
        .update({
          generation_status: "failed",
          failure_reason: reason,
          retry_count: (wasFailed ? 1 : 0) + 1,
          last_attempted_at: attemptedAt,
        })
        .eq("id", transitId);
      result.failed++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "failed",
        reason,
      });
      continue;
    }

    // Persist. Preserves the existing cron-side write shape so admin
    // tooling that reads `generated_at` and `failure_reason` keeps
    // working unchanged.
    const { error: updateErr } = await admin
      .from("monthly_transits")
      .update({
        transit_data: transitData,
        generation_status: "generated",
        generated_at: attemptedAt,
        failure_reason: null,
        last_attempted_at: attemptedAt,
      })
      .eq("id", transitId);

    if (updateErr) {
      result.failed++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "failed",
        reason: updateErr.message,
      });
      continue;
    }

    if (wasFailed) {
      result.retried++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "retried",
      });
    } else if (wasStale) {
      result.regenerated++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "regenerated",
      });
    } else {
      result.generated++;
      result.details.push({
        family_member_id: fm.id,
        full_name: fm.full_name,
        outcome: "generated",
      });
    }
  }

  return result;
}
